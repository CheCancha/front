import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Text,
  Img,
  Button,
  Section,
} from "@react-email/components";
import * as React from "react";

interface WelcomeEmailProps {
  managerName: string;
  managerPhone: string;
  temporaryPassword: string;
  loginUrl: string;
  logoUrl: string;
}

export const WelcomeEmail = ({
  managerName,
  managerPhone,
  temporaryPassword,
  loginUrl,
  logoUrl,
}: WelcomeEmailProps) => (
  <Html>
    <Head />
    <Preview>¡Bienvenido a CheCancha! Tus datos de acceso están aquí.</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={header}>
          <Img src={logoUrl} alt="CheCancha Logo" width="150" />
        </Section>
        <Section style={content}>
          <Heading as="h1" style={h1}>Bienvenido/a, {managerName}!</Heading>
          <Text style={paragraph}>
            Tu solicitud para unirte a Che Cancha ha sido aprobada. ¡Ya podés empezar a gestionar tu complejo y recibir reservas online!
          </Text>
          
          <Section style={credentialsBox}>
            <Heading as="h2" style={h2}>Tus datos para el primer acceso:</Heading>
            <Text style={credentialText}>
              <strong>Teléfono (usuario):</strong> {managerPhone}
            </Text>
            <Text style={credentialText}>
              <strong>Contraseña Temporal:</strong> <span style={password}>{temporaryPassword}</span>
            </Text>
          </Section>
          
          <Text style={paragraph}>
            Por seguridad, te recomendamos iniciar sesión y cambiar tu contraseña desde tu perfil lo antes posible.
          </Text>
          
          <Section style={{ textAlign: "center", margin: "30px 0" }}>
            <Button style={ctaButton} href={loginUrl}>
              Iniciar Sesión
            </Button>
          </Section>
        </Section>
        
        <Section style={footer}>
          <Text style={footerText}>
            Si no solicitaste una cuenta, por favor ignora este correo.
            <br />
            &copy; {new Date().getFullYear()} CheCancha. Todos los derechos reservados.
          </Text>
        </Section>
      </Container>
    </Body>
  </Html>
);

export default WelcomeEmail;

// --- Estilos ---
const main = { backgroundColor: "#f4f4f4", fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif" };
const container = { maxWidth: "600px", margin: "20px auto", backgroundColor: "#ffffff", border: "1px solid #e0e0e0", borderRadius: "12px", overflow: "hidden" as const };
const header = { backgroundColor: "#f97316", padding: "20px", textAlign: "center" as const };
const content = { padding: "30px", color: "#333333", lineHeight: "1.6" };
const h1 = { fontSize: "26px", color: "#1a1a1a", marginTop: 0 };
const h2 = { fontSize: "18px", marginTop: 0, color: "#1a1a1a" };
const paragraph = { fontSize: "16px" };
const credentialsBox = { backgroundColor: "#f8f8f8", padding: "20px", borderRadius: "8px", margin: "25px 0", borderLeft: "4px solid #ff4e02" };
const credentialText = { margin: "10px 0" };
const password = { fontSize: "20px", fontWeight: "bold" as const, color: "#d9534f", backgroundColor: "#fdf2f2", padding: "4px 10px", borderRadius: "6px", display: "inline-block", letterSpacing: "1px" };
const ctaButton = { display: "inline-block", padding: "14px 28px", fontSize: "16px", color: "#ffffff", backgroundColor: "#ff4e02", textDecoration: "none", borderRadius: "8px", fontWeight: "bold" as const };
const footer = { textAlign: "center" as const, padding: "20px", backgroundColor: "#fafafa" };
const footerText = { fontSize: "12px", color: "#888888" };
