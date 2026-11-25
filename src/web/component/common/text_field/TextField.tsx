import React, {ChangeEvent, FC, InputHTMLAttributes} from "react";
import style from "./TextField.module.css";

type NativeInputProps = Pick<InputHTMLAttributes<HTMLInputElement>,
	"autoComplete" | "disabled" | "inputMode" | "maxLength" | "minLength" | "name" | "pattern" | "placeholder" | "required" | "type"
>;

interface TextFieldProps extends NativeInputProps {
	id: string;
	label: string;
	value: string;
	onChange: (event: ChangeEvent<HTMLInputElement>) => void;
	invalid?: boolean;
	error?: string;
	describedBy?: string;
	/** В ui-kit / auth-макетах звёздочки нет; true — только если явно нужно вне design/pages */
	showRequiredIndicator?: boolean;
}

const TextField: FC<TextFieldProps> = ({
	id,
	label,
	value,
	onChange,
	invalid = false,
	error,
	describedBy,
	required = false,
	showRequiredIndicator = false,
	...inputProps
}) => {
	const errorId = error ? `${id}-error` : undefined;
	const ariaDescribedBy = [errorId, describedBy].filter(Boolean).join(" ") || undefined;

	return (
		<div className={style.field}>
			<label className={style.label} htmlFor={id}>
				{label}{showRequiredIndicator && required && <span aria-hidden="true"> *</span>}
			</label>
			<input
				{...inputProps}
				className={style.control}
				id={id}
				value={value}
				onChange={onChange}
				required={required}
				aria-invalid={invalid || Boolean(error)}
				aria-describedby={ariaDescribedBy}
			/>
			{error && <p id={errorId} className={style.error} role="alert">{error}</p>}
		</div>
	);
};

export default TextField;