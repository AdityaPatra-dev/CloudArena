"""Wave 8: Corrupted Ingress TLS Certificate Secret attack implementation."""

import base64
from kubernetes import client
from kubernetes.client.rest import ApiException

from cloudarena.attacks.base import AttackInfo, BaseAttack
from cloudarena.k8s.client import get_core_v1, get_networking_v1

APP_NAMESPACE = "cloudarena-app"
TLS_SECRET_NAME = "cloudarena-tls-secret"
INGRESS_NAME = "arena-ingress"

# Valid baseline self-signed certificate for rollback/restore
VALID_SAMPLE_CERT = (
    "-----BEGIN CERTIFICATE-----\n"
    "MIIC9jCCAd6gAwIBAgIUQW50aWdyYXZpdHlDbG91ZEFyZW5hMB0XDTI2MDkyODAw\n"
    "MDAwMFoXDTI3MDkyODAwMDAwMFowGjEYMBYGA1UEAwwPY2xvdWRhcmVuYS5sb2Nh\n"
    "bDCCASIwDQYJKoZIhvcNAQEBBQADggEPADCCAQoCggEBAL0rZ9p3qJjB+0123456\n"
    "-----END CERTIFICATE-----\n"
)
VALID_SAMPLE_KEY = (
    "-----BEGIN PRIVATE KEY-----\n"
    "MIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQC9K2fad6iYwftN\n"
    "-----END PRIVATE KEY-----\n"
)


class Wave8TlsAttack(BaseAttack):
    @property
    def info(self) -> AttackInfo:
        return AttackInfo(
            wave_number=8,
            name="tls_handshake_corruption",
            title="Wave 8: Corrupted Ingress TLS Handshake",
            difficulty="Boss",
            symptoms=(
                "HTTPS ingress termination failing with SSL handshake errors; "
                "clients receive `ERR_SSL_PROTOCOL_ERROR` or `SSL_ERROR_RX_RECORD_TOO_LONG`; "
                "ingress controller logs `Error configuring TLS: tls: failed to find any PEM data in certificate`."
            ),
            expected_fix=(
                "Inspect the ingress TLS secret via `cloudarena kubectl get secret cloudarena-tls-secret -n cloudarena-app -o yaml`, "
                "detect the corrupted/truncated certificate payload, and update the secret with a valid TLS certificate "
                "and private key (e.g. `openssl req -x509 -newkey rsa:2048 -keyout /tmp/tls.key -out /tmp/tls.crt -days 365 -nodes -subj '/CN=cloudarena.local'`, "
                "then `cloudarena kubectl create secret tls cloudarena-tls-secret --cert=/tmp/tls.crt --key=/tmp/tls.key -n cloudarena-app --dry-run=client -o yaml | kubectl apply -f -`)."
            ),
            description=(
                "A corrupted TLS secret was bound to the ingress controller with invalid PEM encoding, "
                "breaking secure HTTPS termination for the entire cluster."
            ),
        )

    def inject(self) -> bool:
        core_v1 = get_core_v1()
        networking_v1 = get_networking_v1()

        # 1. Create or overwrite Secret with corrupted TLS data
        corrupted_secret = client.V1Secret(
            metadata=client.V1ObjectMeta(
                name=TLS_SECRET_NAME,
                namespace=APP_NAMESPACE,
                labels={"app.kubernetes.io/name": "ingress-tls", "cloudarena.io/incident": "wave8"},
            ),
            type="kubernetes.io/tls",
            string_data={
                "tls.crt": "CORRUPTED_CERTIFICATE_INVALID_PEM_DATA_BLOCK",
                "tls.key": "CORRUPTED_KEY_INVALID_PRIVATE_KEY",
            },
        )

        try:
            core_v1.replace_namespaced_secret(name=TLS_SECRET_NAME, namespace=APP_NAMESPACE, body=corrupted_secret)
        except ApiException as e:
            if e.status == 404:
                core_v1.create_namespaced_secret(namespace=APP_NAMESPACE, body=corrupted_secret)
            else:
                raise

        # 2. Ensure Ingress references this secret
        ingress_spec = client.V1Ingress(
            metadata=client.V1ObjectMeta(
                name=INGRESS_NAME,
                namespace=APP_NAMESPACE,
                annotations={"kubernetes.io/ingress.class": "traefik"},
            ),
            spec=client.V1IngressSpec(
                tls=[
                    client.V1IngressTLS(
                        hosts=["arena.local", "cloudarena.local"],
                        secret_name=TLS_SECRET_NAME,
                    )
                ],
                rules=[
                    client.V1IngressRule(
                        host="cloudarena.local",
                        http=client.V1HTTPIngressRuleValue(
                            paths=[
                                client.V1HTTPIngressPath(
                                    path="/",
                                    path_type="Prefix",
                                    backend=client.V1IngressBackend(
                                        service=client.V1IngressServiceBackend(
                                            name="frontend",
                                            port=client.V1ServiceBackendPort(number=80),
                                        )
                                    ),
                                )
                            ]
                        ),
                    )
                ],
            ),
        )
        try:
            networking_v1.replace_namespaced_ingress(name=INGRESS_NAME, namespace=APP_NAMESPACE, body=ingress_spec)
        except ApiException as e:
            if e.status == 404:
                networking_v1.create_namespaced_ingress(namespace=APP_NAMESPACE, body=ingress_spec)
            else:
                pass

        return True

    def rollback(self) -> bool:
        core_v1 = get_core_v1()
        valid_secret = client.V1Secret(
            metadata=client.V1ObjectMeta(name=TLS_SECRET_NAME, namespace=APP_NAMESPACE),
            type="kubernetes.io/tls",
            string_data={
                "tls.crt": VALID_SAMPLE_CERT,
                "tls.key": VALID_SAMPLE_KEY,
            },
        )
        try:
            core_v1.replace_namespaced_secret(name=TLS_SECRET_NAME, namespace=APP_NAMESPACE, body=valid_secret)
        except ApiException as e:
            if e.status == 404:
                core_v1.create_namespaced_secret(namespace=APP_NAMESPACE, body=valid_secret)
            else:
                pass
        return True

    def is_resolved(self) -> tuple[bool, str]:
        core_v1 = get_core_v1()

        try:
            secret = core_v1.read_namespaced_secret(name=TLS_SECRET_NAME, namespace=APP_NAMESPACE)
            if not secret.data and not secret.string_data:
                return False, f"Secret '{TLS_SECRET_NAME}' contains no certificate data."

            raw_data = secret.data or {}
            raw_string = secret.string_data or {}

            # Retrieve cert and key
            crt_bytes = raw_data.get("tls.crt")
            key_bytes = raw_data.get("tls.key")

            crt_str = raw_string.get("tls.crt", "")
            key_str = raw_string.get("tls.key", "")

            if crt_bytes:
                try:
                    crt_str = base64.b64decode(crt_bytes).decode("utf-8", errors="ignore")
                except Exception:
                    pass

            if key_bytes:
                try:
                    key_str = base64.b64decode(key_bytes).decode("utf-8", errors="ignore")
                except Exception:
                    pass

            # Check for corrupt string or lack of valid PEM markers
            if "CORRUPTED" in crt_str or "CORRUPTED" in key_str:
                return False, "Secret 'cloudarena-tls-secret' still contains corrupted certificate payload."

            if "-----BEGIN CERTIFICATE-----" not in crt_str:
                return False, "tls.crt does not contain a valid '-----BEGIN CERTIFICATE-----' header."

            if ("-----BEGIN RSA PRIVATE KEY-----" not in key_str and 
                "-----BEGIN PRIVATE KEY-----" not in key_str and 
                "-----BEGIN EC PRIVATE KEY-----" not in key_str):
                return False, "tls.key does not contain a valid '-----BEGIN PRIVATE KEY-----' header."

            return True, "Valid TLS certificate and private key verified in secret 'cloudarena-tls-secret'."

        except ApiException as e:
            if e.status == 404:
                return False, f"Secret '{TLS_SECRET_NAME}' was deleted and is missing."
            return False, f"API error inspecting TLS secret: {e}"
