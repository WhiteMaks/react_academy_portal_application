import React, {FC, ReactNode} from "react";
import AuthBrand from "../auth_brand/AuthBrand";
import style from "./AuthFormLayout.module.css";

export type AuthFormLayoutProps = {
	/** id для aria-labelledby на карточке */
	ariaLabelledBy: string;
	/** Заголовок h1; если не задан — слот для SessionCheck без заголовка */
	title?: string;
	/** Поясняющий текст под заголовком (lead) */
	lead?: string;
	/** Надзаголовок (eyebrow), напр. «Панель администратора» */
	eyebrow?: string;
	/** Подпись под формой */
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
}) => {
	return (
		<main className={style.page}>
			<section
				className={[style.card, className ?? ""].filter(Boolean).join(" ")}
				aria-labelledby={title ? ariaLabelledBy : undefined}
			>
				<AuthBrand/>
				{eyebrow && <p className={style.eyebrow}>{eyebrow}</p>}
				{title && <h1 id={ariaLabelledBy}>{title}</h1>}
				{lead && <p className={style.lead}>{lead}</p>}
				{children}
				{footnote && <p className={style.footnote}>{footnote}</p>}
			</section>
		</main>
	);
};

export function AuthStatusBlock({text, busy = true}: {text: string; busy?: boolean}) {
	return (
		<div className={style.status} aria-busy={busy} aria-live="polite">
			<div className={style.spinner} role="status" aria-label="Загрузка"/>
			<p className={style.statusText}>{text}</p>
		</div>
	);
}

export function AuthStack({children, className}: {children: ReactNode; className?: string}) {
	return (
		<div className={[style.stack, className ?? ""].filter(Boolean).join(" ")}>
			{children}
		</div>
	);
}

export default AuthFormLayout;