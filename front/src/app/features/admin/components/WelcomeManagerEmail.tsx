import React from "react";

interface WelcomeManagerEmailProps {
  managerName: string;
  managerEmail: string;
  temporaryPassword: string;
  loginUrl: string;
}

export const WelcomeManagerEmail: React.FC<WelcomeManagerEmailProps> = ({
  managerName,
  managerEmail,
  temporaryPassword,
  loginUrl,
}) => (
  <div>
    <h1>¡Bienvenido a CheCancha, {managerName}!</h1>
    <p>
      Tu solicitud para el complejo ha sido aprobada. Ya podés empezar a
      gestionar tus canchas y reservas.
    </p>
    <p>Estos son tus datos de acceso temporales:</p>
    <ul>
      <li>
        <strong>Email:</strong> {managerEmail}
      </li>
      <li>
        <strong>Contraseña:</strong> <strong>{temporaryPassword}</strong>
      </li>
    </ul>
    <p>
      Por favor, iniciá sesión y cambiá tu contraseña desde tu perfil lo antes
      posible.
    </p>
    <a href={loginUrl}>Iniciar Sesión en CheCancha</a>
    <br />
    <p>¡Gracias por unirte a nuestra comunidad!</p>
  </div>
);
