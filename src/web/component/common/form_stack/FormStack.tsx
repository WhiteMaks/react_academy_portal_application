import React, {FC, FormHTMLAttributes, ReactNode} from "react";
import style from "./FormStack.module.css";

interface FormStackProps extends Omit<FormHTMLAttributes<HTMLFormElement>, "children"> {
	children: ReactNode;
	useDesignKit?: boolean;
}

const FormStack: FC<FormStackProps> = ({children, className, useDesignKit = false, ...props}) => (
	<form
		{...props}
		className={[
			useDesignKit ? "academy-auth__stack" : style.form,
			className ?? ""
		].filter(Boolean).join(" ")}
	>
		{children}
	</form>
);

export default FormStack;