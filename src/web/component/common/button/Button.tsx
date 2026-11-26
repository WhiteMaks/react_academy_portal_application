import React, {ButtonHTMLAttributes, FC} from "react";
import style from "./Button.module.css";

export type ButtonVariant = "primary" | "secondary" | "text" | "gold";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
	variant?: ButtonVariant;
	fullWidth?: boolean;
	useDesignKit?: boolean;
}

const kitVariantClass: Record<ButtonVariant, string> = {
	primary: "btn--primary",
	secondary: "",
	gold: "btn--gold",
	text: "btn--link"
};

const Button: FC<ButtonProps> = ({
	variant = "primary",
	fullWidth = false,
	useDesignKit = false,
	className,
	children,
	type = "button",
	...props
}) => {
	if (useDesignKit) {
		return (
			<button
				{...props}
				type={type}
				className={[
					"btn",
					kitVariantClass[variant],
					fullWidth ? "btn--block" : "",
					className ?? ""
				].filter(Boolean).join(" ")}
			>
				{children}
			</button>
		);
	}

	return (
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
};

export default Button;