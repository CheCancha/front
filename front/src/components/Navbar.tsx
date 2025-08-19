import type { FC } from 'react';
import Link from 'next/link';
import Image from 'next/image';
// import { FaInstagram } from 'react-icons/fa';

const Navbar: FC = () => {
return (
<nav className="bg-white shadow-md sticky top-0 z-20">
<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
<div className="flex items-center justify-between h-16">
<div className="flex-shrink-0">
<Link href="/" className="flex items-center">
<Image
src="/logo.png"
alt="Logo de Che Cancha"
height={50}
width={50}
        />
<span className="text-foreground text-xl font-medium">CheCancha</span>
</Link>
</div>

      {/* Enlaces y CTA */}
      <div className="hidden md:block">
        <div className="ml-10 flex items-center space-x-4">
          <Link href="/gestion-canchas" className="text-brand-dark hover:text-brand-orange transition duration-300">
            Software para canchas
          </Link>
          <Link href="/iniciar-sesion" className="bg-brand-orange hover:bg-opacity-90 text-white font-medium py-2 px-4 rounded-md transition duration-300">
            Iniciar Sesión
          </Link>
          <Link href="[https://www.instagram.com/tu_cuenta_de_instagram](https://www.instagram.com/tu_cuenta_de_instagram)" target="_blank" rel="noopener noreferrer" className="text-brand-dark hover:text-brand-orange transition duration-300">
            {/* <FaInstagram className="h-6 w-6" /> */}
            <span className="sr-only">Instagram</span>
          </Link>
        </div>
      </div>

      <div className="-mr-2 flex md:hidden">
      </div>
    </div>
  </div>
</nav>
);
};

export default Navbar;