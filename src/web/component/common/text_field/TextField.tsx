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
	describedBy?: string;
}

const TextField: FC<TextFieldProps> = ({
	id,
	label,
	value,
	onChange,
	invalid = false,
	describedBy,
	required = false,
	...inputProps
}) => (
	<div className={style.field}>
		<label className={style.label} htmlFor={id}>
			{label}{required && <span aria-hidden="true"> *</span>}
		</label>
		<input
			{...inputProps}
			className={style.control}
			id={id}
			value={value}
			onChange={onChange}
			required={required}
			aria-invalid={invalid}
			aria-describedby={describedBy}
		/>
	</div>
);

export default TextField;
