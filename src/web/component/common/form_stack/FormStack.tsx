import React, {FC, FormHTMLAttributes, ReactNode} from "react";
import style from "./FormStack.module.css";

interface FormStackProps extends Omit<FormHTMLAttributes<HTMLFormElement>, "children"> {
	children: ReactNode;
}

const FormStack: FC<FormStackProps> = ({children, className, ...props}) => (
	<form {...props} className={[style.form, className ?? ""].filter(Boolean).join(" ")}>
		{children}
	</form>
);

export default FormStack;
