import React, {FC} from "react";
import {
	COACH_NAME_MAX_LEN,
	COACH_NOTE_MAX_LEN,
	COACH_PHONE_INPUT_MAX_LEN,
	COACH_SPECIALIZATION_MAX_LEN
} from "../../../api/constants/coachFieldLimits";
import TextField from "../common/text_field/TextField";
import TextAreaField from "../common/text_area_field/TextAreaField";
import {CoachFormField, CoachFormValues} from "./coachFormTypes";

export type CoachFormFieldsProps = {
	form: CoachFormValues;
	fieldError: (field: CoachFormField) => string | undefined;
	onFieldChange: (key: keyof CoachFormValues, value: string) => void;
	idPrefix?: string;
	sectionHeading?: "h2" | "h3";
	noteAsTextarea?: boolean;
	fieldsDisabled?: boolean;
};

const CoachFormFields: FC<CoachFormFieldsProps> = ({
	form,
	fieldError,
	onFieldChange,
	idPrefix = "coach",
	sectionHeading = "h3",
	noteAsTextarea = false,
	fieldsDisabled = false
}) => {
	const SectionTitle = sectionHeading;
	const coachTitleId = `${idPrefix}-coach-block-title`;

	return (
		<div className="academy-modal__sections">
			<section className="academy-modal__section" aria-labelledby={coachTitleId}>
				<SectionTitle className="academy-modal__section-title" id={coachTitleId}>
					Тренер
				</SectionTitle>
				<div className="academy-modal__split">
					<div className="academy-modal__split-col academy-modal__split-col--identity">
						<TextField
							useDesignKit
							showRequiredIndicator
							required
							id={`${idPrefix}-last-name`}
							name="last_name"
							label="Фамилия"
							autoComplete="family-name"
							maxLength={COACH_NAME_MAX_LEN}
							value={form.last_name}
							error={fieldError("last_name")}
							invalid={Boolean(fieldError("last_name"))}
							readOnly={fieldsDisabled}
							onChange={e => onFieldChange("last_name", e.target.value)}
						/>
						<TextField
							useDesignKit
							showRequiredIndicator
							required
							id={`${idPrefix}-first-name`}
							name="first_name"
							label="Имя"
							autoComplete="given-name"
							maxLength={COACH_NAME_MAX_LEN}
							value={form.first_name}
							error={fieldError("first_name")}
							invalid={Boolean(fieldError("first_name"))}
							readOnly={fieldsDisabled}
							onChange={e => onFieldChange("first_name", e.target.value)}
						/>
						<TextField
							useDesignKit
							id={`${idPrefix}-patronymic`}
							name="patronymic"
							label="Отчество"
							autoComplete="additional-name"
							maxLength={COACH_NAME_MAX_LEN}
							value={form.patronymic}
							error={fieldError("patronymic")}
							invalid={Boolean(fieldError("patronymic"))}
							readOnly={fieldsDisabled}
							onChange={e => onFieldChange("patronymic", e.target.value)}
						/>
					</div>
					<div className="academy-modal__split-col academy-modal__split-col--contacts">
						<TextField
							useDesignKit
							showRequiredIndicator
							required
							id={`${idPrefix}-birth-date`}
							name="birth_date"
							label="Дата рождения"
							inputMode="numeric"
							placeholder="дд.мм.гггг"
							autoComplete="bday"
							value={form.birth_date}
							error={fieldError("birth_date")}
							invalid={Boolean(fieldError("birth_date"))}
							readOnly={fieldsDisabled}
							onChange={e => onFieldChange("birth_date", e.target.value)}
						/>
						<TextField
							useDesignKit
							showRequiredIndicator
							required
							id={`${idPrefix}-phone`}
							name="phone"
							label="Телефон"
							type="tel"
							autoComplete="tel"
							placeholder="+7 …"
							maxLength={COACH_PHONE_INPUT_MAX_LEN}
							value={form.phone}
							error={fieldError("phone")}
							invalid={Boolean(fieldError("phone"))}
							readOnly={fieldsDisabled}
							onChange={e => onFieldChange("phone", e.target.value)}
						/>
						<p className="academy-modal__col-hint">
							С кодом страны, с «+». Пробелы и дефисы можно — сохраним только цифры после «+».
						</p>
						<TextField
							useDesignKit
							showRequiredIndicator
							required
							id={`${idPrefix}-specialization`}
							name="specialization"
							label="Специализация"
							placeholder="Кикбоксинг, каратэ…"
							maxLength={COACH_SPECIALIZATION_MAX_LEN}
							value={form.specialization}
							error={fieldError("specialization")}
							invalid={Boolean(fieldError("specialization"))}
							readOnly={fieldsDisabled}
							onChange={e => onFieldChange("specialization", e.target.value)}
						/>
					</div>
				</div>
			</section>
			{noteAsTextarea ? (
				<TextAreaField
					useDesignKit
					fullWidth
					id={`${idPrefix}-note`}
					name="note"
					label="Примечание"
					rows={4}
					placeholder="Дополнительная информация о тренере"
					maxLength={COACH_NOTE_MAX_LEN}
					value={form.note}
					error={fieldError("note")}
					invalid={Boolean(fieldError("note"))}
					readOnly={fieldsDisabled}
					onChange={e => onFieldChange("note", e.target.value)}
				/>
			) : (
				<TextField
					useDesignKit
					id={`${idPrefix}-note`}
					name="note"
					label="Примечание"
					maxLength={COACH_NOTE_MAX_LEN}
					value={form.note}
					error={fieldError("note")}
					invalid={Boolean(fieldError("note"))}
					readOnly={fieldsDisabled}
					onChange={e => onFieldChange("note", e.target.value)}
				/>
			)}
		</div>
	);
};

export default CoachFormFields;