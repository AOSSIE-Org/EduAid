import aossieLogo from "../assets/aossie_logo64.png";
import { ModeToggle } from "./mode-toggle";

export default function Navbar() {
  return (
    <div className="flex items-center justify-between mr-4 ml-4 mt-2 mb-2">
      <div className="flex items-center">
        <img
          src={aossieLogo}
          alt="Aossie Logo"
          className="w-12 h-12 mr-4 rounded-md"
        />
        <h1 className="text-2xl font-bold">EDU AID</h1>
      </div>
      {/* <div className="relative"> */}
        <ModeToggle></ModeToggle>
      {/* </div> */}
    </div>
  );
}
