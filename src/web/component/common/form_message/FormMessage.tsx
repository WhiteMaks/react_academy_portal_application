import React, {FC} from "react";
import style from "./FormMessage.module.css";

interface FormMessageProps {
	children: string;
	variant?: "error" | "notice";
	id?: string;
}

const FormMessage: FC<FormMessageProps> = ({children, variant = "error", id}) => (
	<div id={id} className={[style.message, style[variant]].join(" ")}
		role={variant === "error" ? "alert" : "status"}
		aria-live={variant === "error" ? "assertive" : "polite"}>
		{children}
	</div>
);

export default FormMessage;
