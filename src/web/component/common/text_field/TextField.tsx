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
	showRequiredIndicator?: boolean;
	/** Классы ui-kit как в design/pages (academy-field) */
	useDesignKit?: boolean;
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
	useDesignKit = false,
	...inputProps
}) => {
	const errorId = error ? `${id}-error` : undefined;
	const ariaDescribedBy = [errorId, describedBy].filter(Boolean).join(" ") || undefined;

	if (useDesignKit) {
		return (
			<label className="academy-field" htmlFor={id}>
				<span
					className={[
						"academy-field__label",
						showRequiredIndicator && required ? "academy-field__label--required" : ""
					].filter(Boolean).join(" ")}
					id={`${id}-label`}
				>
					{label}
				</span>
				<input
					{...inputProps}
					className="academy-field__control"
					id={id}
					value={value}
					onChange={onChange}
					required={required}
					aria-invalid={invalid || Boolean(error)}
					aria-labelledby={`${id}-label`}
					aria-describedby={ariaDescribedBy}
				/>
				{error && (
					<p id={errorId} className="academy-field__error" role="alert">
						{error}
					</p>
				)}
			</label>
		);
	}

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