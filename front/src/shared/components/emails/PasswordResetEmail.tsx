import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Text,
  Button,
  Section,
} from "@react-email/components";
import * as React from "react";

interface PasswordResetEmailProps {
  resetUrl: string;
}

export const PasswordResetEmail = ({ resetUrl }: PasswordResetEmailProps) => (
  <Html>
    <Head />
    <Preview>Restablecé tu contraseña de CheCancha</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={content}>
          <Heading as="h1" style={h1}>Solicitud de Reseteo de Contraseña</Heading>
          <Text style={paragraph}>
            Recibimos una solicitud para restablecer la contraseña de tu cuenta. Hacé clic en el botón de abajo para elegir una nueva.
          </Text>
          
          <Section style={{ textAlign: "center" as const, margin: "20px 0" }}>
            <Button style={ctaButton} href={resetUrl}>
              Resetear Contraseña
            </Button>
          </Section>
          
          <Text style={paragraph}>
            Si no solicitaste un cambio de contraseña, podés ignorar este correo sin problemas.
          </Text>
          
          <Text style={note}>
            Este enlace es válido por 1 hora.
          </Text>
        </Section>
      </Container>
    </Body>
  </Html>
);

export default PasswordResetEmail;

// --- Estilos ---
const main = { backgroundColor: "#f4f4f4", fontFamily: "Arial, sans-serif" };
const container = { maxWidth: "600px", margin: "20px auto", padding: "20px", backgroundColor: "#ffffff", border: "1px solid #ddd", borderRadius: "10px" };
const content = { lineHeight: "1.6", color: "#333" };
const h1 = { fontSize: "24px", color: "#1a1a1a" };
const paragraph = { fontSize: "16px" };                                                                               //brand-orange
const ctaButton = { display: "inline-block", padding: "12px 24px", fontSize: "16px", color: "white", backgroundColor: "#ff4e02", textDecoration: "none", borderRadius: "5px", fontWeight: "bold" as const };
const note = { marginTop: "30px", fontSize: "12px", color: "#888" };