import React, {FC, ReactNode} from "react";
import AuthBrand from "../auth_brand/AuthBrand";

export type AuthFormLayoutProps = {
	ariaLabelledBy: string;
	title?: string;
	lead?: string;
	eyebrow?: string;
	footnote?: ReactNode;
	children: ReactNode;
	className?: string;
};

const AuthFormLayout: FC<AuthFormLayoutProps> = ({
	title,
	lead,
	eyebrow,
	children,
	ariaLabelledBy,
	className,
	footnote
}) => (
	<div className="academy-auth">
		<section
			className={["academy-auth__card", className ?? ""].filter(Boolean).join(" ")}
			aria-labelledby={title ? ariaLabelledBy : undefined}
		>
			<AuthBrand/>
			{eyebrow && <p className="academy-auth__eyebrow">{eyebrow}</p>}
			{title && <h1 id={ariaLabelledBy}>{title}</h1>}
			{lead && <p className="academy-auth__lead">{lead}</p>}
			{children}
			{footnote && <p className="academy-auth__footnote">{footnote}</p>}
		</section>
	</div>
);

export function AuthStatusBlock({text, busy = true}: {text: string; busy?: boolean}) {
	return (
		<div className="academy-auth__status" aria-busy={busy} aria-live="polite">
			<div className="academy-auth__spinner" role="status" aria-label="Загрузка"/>
			<p className="academy-auth__status-text">{text}</p>
		</div>
	);
}

export function AuthStack({children, className}: {children: ReactNode; className?: string}) {
	return (
		<div className={["academy-auth__stack", className ?? ""].filter(Boolean).join(" ")}>
			{children}
		</div>
	);
}

export default AuthFormLayout;