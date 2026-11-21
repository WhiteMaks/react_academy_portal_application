import React, {ButtonHTMLAttributes, FC} from "react";
import style from "./Button.module.css";

export type ButtonVariant = "primary" | "secondary" | "text";

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
		{children}
	</button>
);

export default Button;
