import React, {FC, FormHTMLAttributes, ReactNode} from "react";

export type DesignFormProps = Omit<FormHTMLAttributes<HTMLFormElement>, "noValidate"> & {
	children: ReactNode;
};

/**
 * Продуктовая форма: только своя validate(), без нативных подсказок браузера.
 * Auth: FormStack + noValidate; модалки и страницы — DesignForm.
 */
const DesignForm: FC<DesignFormProps> = ({children, ...props}) => (
	<form noValidate {...props}>
		{children}
	</form>
);

export default DesignForm;