import React from 'react';

// Contenido del Aviso de Privacidad conforme a la Ley Federal de Protección de
// Datos Personales en Posesión de los Particulares (LFPDPPP, reforma vigente
// desde el 21 de marzo de 2025). CargoVigil trata datos patrimoniales/
// financieros (saldos y cuentas bancarias enmascaradas de sus empresas
// cliente) — esa categoría exige consentimiento EXPRESO, no tácito, por eso
// este aviso se muestra completo y con una casilla separada antes de dejar
// entrar a cualquier usuario nuevo (ver PrivacyConsentModal). Placeholders
// como el domicilio fiscal deben confirmarse con el área legal antes de un
// lanzamiento real; el resto del contenido sí refleja lo que la plataforma
// hace hoy (revisado contra domain/auth y domain/company).
//
// LAST_UPDATED se muestra en el propio aviso y además se usa como parte de
// la llave de consentimiento en localStorage (ver PrivacyConsentModal): si
// el texto cambia de fondo, hay que subir esta fecha para forzar que todos
// vuelvan a aceptar.
export const PRIVACY_NOTICE_LAST_UPDATED = '2026-09-13';

interface SectionProps {
  title: string;
  children: React.ReactNode;
}

const Section: React.FC<SectionProps> = ({ title, children }) => (
  <section className="space-y-2">
    <h3 className="text-sm font-bold text-white tracking-tight">{title}</h3>
    <div className="text-xs text-gray-400 leading-relaxed space-y-2">{children}</div>
  </section>
);

/**
 * Cuerpo del aviso de privacidad. Sin envoltura de página ni de modal a
 * propósito: se reutiliza tanto en la página pública `/privacidad` como
 * dentro del modal de consentimiento que se muestra tras el primer login.
 */
export const PrivacyNoticeContent: React.FC = () => (
  <div className="space-y-6">
    <p className="text-[11px] text-gray-500">
      Última actualización: {PRIVACY_NOTICE_LAST_UPDATED}
    </p>

    <Section title="1. Responsable del tratamiento">
      <p>
        CargoVigil Technologies ("CargoVigil", "la Plataforma"), con domicilio en Monterrey,
        Nuevo León, México, es responsable del tratamiento de los datos personales que se
        recaban a través de este sitio y de la aplicación, de conformidad con la Ley Federal
        de Protección de Datos Personales en Posesión de los Particulares (LFPDPPP).
      </p>
    </Section>

    <Section title="2. Datos que recabamos">
      <p>Dependiendo de tu rol dentro de la plataforma, podemos tratar:</p>
      <ul className="list-disc list-inside space-y-1 pl-1">
        <li><span className="text-gray-300 font-medium">Identificación y contacto:</span> nombre de usuario, correo electrónico, empresa a la que perteneces y rol asignado.</li>
        <li><span className="text-gray-300 font-medium">Seguridad de la cuenta:</span> contraseña (almacenada cifrada, nunca en texto plano), estado de tu segundo factor de autenticación (TOTP) y bitácora de sesiones.</li>
        <li>
          <span className="text-amber-400 font-medium">Datos patrimoniales y financieros:</span> nombre de banco, últimos dígitos de cuenta (nunca el número completo) y saldos de las cuentas bancarias que tu empresa registra para la proyección de flujo de caja, además de facturas, gastos y montos de contratos operados en la plataforma. <strong className="text-gray-300">El tratamiento de esta categoría de datos requiere tu consentimiento expreso</strong>, distinto del resto de finalidades de este aviso.
        </li>
        <li><span className="text-gray-300 font-medium">Datos operativos del negocio:</span> información de vehículos, rutas, clientes y viajes que tu empresa administra — estos datos son de la empresa, no datos personales de una persona identificada, salvo cuando incluyen el nombre de un contacto.</li>
      </ul>
    </Section>

    <Section title="3. Finalidades del tratamiento">
      <p><span className="text-gray-300 font-medium">Finalidades primarias (necesarias para el servicio):</span></p>
      <ul className="list-disc list-inside space-y-1 pl-1">
        <li>Crear y administrar tu cuenta de usuario y controlar el acceso según tu rol.</li>
        <li>Operar las funciones que tu empresa contrató: catálogo de flota, tesorería predictiva, gestión de fricciones y colchón de contingencia, cobertura de combustible y radar de viajes.</li>
        <li>Enviarte alertas operativas y financieras generadas por la plataforma (por ejemplo, alertas de liquidez).</li>
        <li>Prevenir accesos no autorizados y detectar actividad sospechosa en tu cuenta.</li>
      </ul>
      <p className="pt-1"><span className="text-gray-300 font-medium">Finalidades secundarias (puedes oponerte sin que se cancele el servicio):</span></p>
      <ul className="list-disc list-inside space-y-1 pl-1">
        <li>Comunicarte mejoras, nuevas funciones o encuestas de satisfacción.</li>
        <li>Elaborar estadísticas internas de uso de la plataforma.</li>
      </ul>
    </Section>

    <Section title="4. Consentimiento">
      <p>
        Al usar la plataforma con finalidades que no involucren datos patrimoniales o
        financieros, entendemos tu consentimiento como tácito conforme a este aviso. Para el
        tratamiento de <span className="text-amber-400">datos patrimoniales y financieros</span> (sección 2),
        te pediremos tu <span className="text-gray-300 font-medium">consentimiento expreso</span> de forma
        separada la primera vez que accedas a la plataforma. Puedes revocar ese consentimiento
        en cualquier momento contactándonos por los medios de la sección 7 — al revocarlo, las
        funciones de tesorería que dependen de esos datos dejarán de estar disponibles para tu
        cuenta.
      </p>
    </Section>

    <Section title="5. Transferencias de datos">
      <p>
        No vendemos ni compartimos tus datos personales con terceros para fines de mercadotecnia.
        Sí compartimos los datos estrictamente necesarios con:
      </p>
      <ul className="list-disc list-inside space-y-1 pl-1">
        <li>Proveedores de infraestructura en la nube que alojan la base de datos y los servidores de la plataforma, quienes actúan como encargados bajo contrato de confidencialidad.</li>
        <li>Autoridades, cuando exista un requerimiento legal válido.</li>
      </ul>
      <p>
        Si el proveedor de nube utilizado tiene servidores fuera de México, esto constituye una
        transferencia internacional de datos amparada por este aviso; el encargado está obligado
        contractualmente a mantener el mismo nivel de protección exigido por la LFPDPPP.
      </p>
    </Section>

    <Section title="6. Derechos ARCO">
      <p>
        Tienes derecho a Acceder, Rectificar y Cancelar tus datos personales, así como a Oponerte
        al tratamiento de los mismos (derechos ARCO), y a revocar tu consentimiento en cualquier
        momento. También puedes limitar el uso o divulgación de tus datos.
      </p>
      <p>
        Si tu cuenta fue creada por el administrador de tu empresa (alta de equipo) o por el
        equipo de CargoVigil (alta de nueva empresa), tus datos de identificación y contacto ya
        fueron capturados por ese tercero en tu nombre — puedes ejercer tus derechos ARCO sobre
        esos datos exactamente igual que si los hubieras registrado tú mismo.
      </p>
    </Section>

    <Section title="7. Cómo ejercer tus derechos o contactarnos">
      <ul className="space-y-1">
        <li>Correo: <span className="text-gray-300">soporte@cargovigil.test</span></li>
        <li>Teléfono: <span className="text-gray-300">+52 (81) 8000-0000</span></li>
        <li>Domicilio: <span className="text-gray-300">Monterrey, N.L., México</span></li>
      </ul>
      <p>Responderemos tu solicitud dentro de los plazos que marca la LFPDPPP.</p>
    </Section>

    <Section title="8. Uso de almacenamiento local del navegador">
      <p>
        La plataforma guarda tu sesión (token de acceso y de renovación) en el almacenamiento
        local de tu navegador para mantenerte conectado. No usamos cookies de rastreo
        publicitario ni compartimos esta información con redes de publicidad.
      </p>
    </Section>

    <Section title="9. Cambios a este aviso">
      <p>
        Cualquier modificación relevante a este aviso se reflejará en la fecha de "Última
        actualización" al inicio de este documento y, cuando afecte finalidades que requieran tu
        consentimiento expreso, se te pedirá aceptarlo nuevamente antes de continuar usando la
        plataforma.
      </p>
    </Section>
  </div>
);
