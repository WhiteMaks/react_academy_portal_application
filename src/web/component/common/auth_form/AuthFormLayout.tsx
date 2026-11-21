import React, {FC, ReactNode} from "react";
import svg_logo from "../../../../img/svg/logo.svg";
import style from "./AuthFormLayout.module.css";

interface AuthFormLayoutProps {
	title: string;
	description?: string;
	children: ReactNode;
	ariaLabelledBy: string;
	className?: string;
}

const AuthFormLayout: FC<AuthFormLayoutProps> = ({
	title,
	description,
	children,
	ariaLabelledBy,
	className
}) => (
	<main className={style.page}>
		<section className={[style.card, className ?? ""].filter(Boolean).join(" ")} aria-labelledby={ariaLabelledBy}>
			<img className={style.logo} src={svg_logo} alt="Академия единоборств"/>
			<h1 id={ariaLabelledBy}>{title}</h1>
			{description && <p className={style.description}>{description}</p>}
			{children}
		</section>
	</main>
);

export default AuthFormLayout;
