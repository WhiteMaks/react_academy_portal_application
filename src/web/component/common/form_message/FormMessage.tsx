import React, {FC} from "react";
import style from "./FormMessage.module.css";

interface FormMessageProps {
	children: string;
	variant?: "error" | "notice";
	id?: string;
	useDesignKit?: boolean;
}

const variantClass: Record<NonNullable<FormMessageProps["variant"]>, string> = {
	error: "academy-alert--error",
	notice: "academy-alert--notice"
};

const FormMessage: FC<FormMessageProps> = ({children, variant = "error", id, useDesignKit = false}) => {
	if (useDesignKit) {
		return (
			<div
				id={id}
				className={["academy-alert", variantClass[variant]].join(" ")}
				role={variant === "error" ? "alert" : "status"}
				aria-live={variant === "error" ? "assertive" : "polite"}
			>
				{children}
			</div>
		);
	}

	return (
		<div id={id} className={[style.message, style[variant]].join(" ")}
			role={variant === "error" ? "alert" : "status"}
			aria-live={variant === "error" ? "assertive" : "polite"}>
			{children}
		</div>
	);
};

export default FormMessage;