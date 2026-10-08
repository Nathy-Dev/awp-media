import { Link } from "react-router-dom";
import { Icon } from "./Icon";

const FOLDERS = [
  { to: "/foundation", label: "Foundation School Messages" },
  { to: "/discipleship", label: "Discipleship Teachings" },
  { to: "/workers", label: "Workers Teachings" },
] as const;

/** Shortcut tiles to the three teaching categories. */
export function FolderLinks() {
  return (
    <div className="folders">
      {FOLDERS.map((folder) => (
        <div className="folder" key={folder.to}>
          <Link to={folder.to}>
            <p>{folder.label}</p>
            <Icon name="folder" size="2rem" />
          </Link>
        </div>
      ))}
    </div>
  );
}
