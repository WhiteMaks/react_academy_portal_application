import React, {ChangeEvent, FC, TextareaHTMLAttributes} from "react";
import style from "./TextAreaField.module.css";

type NativeTextAreaProps = Pick<TextareaHTMLAttributes<HTMLTextAreaElement>,
	"disabled" | "maxLength" | "name" | "placeholder" | "readOnly" | "required" | "rows"
>;

export interface TextAreaFieldProps extends NativeTextAreaProps {
	id: string;
	label: string;
	value: string;
	onChange: (event: ChangeEvent<HTMLTextAreaElement>) => void;
	invalid?: boolean;
	error?: string;
	describedBy?: string;
	showRequiredIndicator?: boolean;
	useDesignKit?: boolean;
	fullWidth?: boolean;
}

const TextAreaField: FC<TextAreaFieldProps> = ({
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
	fullWidth = false,
	...textareaProps
}) => {
	const errorId = error ? `${id}-error` : undefined;
	const ariaDescribedBy = [errorId, describedBy].filter(Boolean).join(" ") || undefined;

	if (useDesignKit) {
		return (
			<label
				className={["academy-field", fullWidth ? "academy-field--full" : ""].filter(Boolean).join(" ")}
				htmlFor={id}
			>
				<span
					className={[
						"academy-field__label",
						showRequiredIndicator && required ? "academy-field__label--required" : ""
					].filter(Boolean).join(" ")}
					id={`${id}-label`}
				>
					{label}
				</span>
				<textarea
					{...textareaProps}
					className="academy-field__control"
					id={id}
					value={value}
					onChange={onChange}
					required={required}
					aria-invalid={invalid || Boolean(error)}
					aria-labelledby={`${id}-label`}
					aria-describedby={ariaDescribedBy}
				/>
				{error ? (
					<p id={errorId} className="academy-field__error" role="alert">
						{error}
					</p>
				) : null}
			</label>
		);
	}

	return (
		<div className={style.field}>
			<label className={style.label} htmlFor={id}>
				{label}{showRequiredIndicator && required ? <span aria-hidden="true"> *</span> : null}
			</label>
			<textarea
				{...textareaProps}
				className={style.control}
				id={id}
				value={value}
				onChange={onChange}
				required={required}
				aria-invalid={invalid || Boolean(error)}
				aria-describedby={ariaDescribedBy}
			/>
			{error ? <p id={errorId} className={style.error} role="alert">{error}</p> : null}
		</div>
	);
};

export default TextAreaField;