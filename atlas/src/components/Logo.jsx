import React from "react";
import logo from "../assets/logo.png";

const Logo = ({ fullLogo }) => {
  return (
    <div className="flex items-center space-x-3">
      <img
        src={logo}
        alt="Infintrix Atlas Logo"
        width={50}
        height={50}
        className="block dark:hidden"
      />
      <img
        src={logo}
        alt="Infintrix Atlas Logo"
        width={50}
        height={50}
        className="hidden dark:block"
      />
      {fullLogo && (
        <span className="font-black text-xl tracking-tighter text-slate-900 dark:text-white">
          Infintrix Atlas
        </span>
      )}
    </div>
  );
};

export default Logo;
