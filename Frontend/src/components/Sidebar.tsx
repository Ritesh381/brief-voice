import { NavLink } from "react-router-dom";
import { Upload, List, Search, BarChart3, Mic } from "lucide-react";

const links = [
  { to: "/upload", label: "Upload", icon: Upload },
  { to: "/meetings", label: "Meetings", icon: List },
  { to: "/search", label: "Search", icon: Search },
  { to: "/analytics", label: "Analytics", icon: BarChart3 },
];

export default function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="brand">
        <Mic size={22} color="#8b5cf6" />
        <span>
          Brief<span className="accent">Voice</span>
        </span>
      </div>
      <nav>
        {links.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) => `nav-link${isActive ? " active" : ""}`}
          >
            <Icon size={18} />
            {label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
