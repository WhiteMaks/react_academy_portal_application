import React, {ButtonHTMLAttributes, FC} from "react";
import style from "./Button.module.css";

export type ButtonVariant = "primary" | "secondary" | "text" | "gold";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
	variant?: ButtonVariant;
	fullWidth?: boolean;
}

const Button: FC<ButtonProps> = ({
	variant = "primary",
	fullWidth = false,
	className,
	children,
	type = "button",
	...props
}) => (
	<button
		{...props}
		type={type}
		className={[
			style.button,
			style[variant],
			fullWidth ? style.fullWidth : "",
			className ?? ""
		].filter(Boolean).join(" ")}
	>
		<span className={style.content}>{children}</span>
	</button>
);

export default Button;
