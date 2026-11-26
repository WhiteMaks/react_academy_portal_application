import React, {FC} from "react";
import {
	ATHLETE_NAME_MAX_LEN,
	ATHLETE_NOTE_MAX_LEN,
	ATHLETE_PHONE_INPUT_MAX_LEN
} from "../../../api/constants/athleteFieldLimits";
import TextField from "../common/text_field/TextField";
import TextAreaField from "../common/text_area_field/TextAreaField";
import {AthleteFormField, AthleteFormValues} from "./athleteFormTypes";

export type AthleteFormFieldsProps = {
	form: AthleteFormValues;
	fieldError: (field: AthleteFormField) => string | undefined;
	onFieldChange: (key: keyof AthleteFormValues, value: string) => void;
	idPrefix?: string;
	sectionHeading?: "h2" | "h3";
	noteAsTextarea?: boolean;
	fieldsDisabled?: boolean;
};

const AthleteFormFields: FC<AthleteFormFieldsProps> = ({
	form,
	fieldError,
	onFieldChange,
	idPrefix = "athlete",
	sectionHeading = "h3",
	noteAsTextarea = false,
	fieldsDisabled = false
}) => {
	const SectionTitle = sectionHeading;
	const athleteTitleId = `${idPrefix}-athlete-block-title`;
	const guardianTitleId = `${idPrefix}-guardian-block-title`;

	return (
		<div className="academy-modal__sections">
			<section className="academy-modal__section" aria-labelledby={athleteTitleId}>
				<SectionTitle className="academy-modal__section-title" id={athleteTitleId}>
					Спортсмен
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
							maxLength={ATHLETE_NAME_MAX_LEN}
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
							maxLength={ATHLETE_NAME_MAX_LEN}
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
							maxLength={ATHLETE_NAME_MAX_LEN}
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
							maxLength={ATHLETE_PHONE_INPUT_MAX_LEN}
							value={form.phone}
							error={fieldError("phone")}
							invalid={Boolean(fieldError("phone"))}
							readOnly={fieldsDisabled}
							onChange={e => onFieldChange("phone", e.target.value)}
						/>
						<p className="academy-modal__col-hint">
							С кодом страны, с «+». Пробелы и дефисы можно — сохраним только цифры после «+».
						</p>
					</div>
				</div>
			</section>
			<section
				className="academy-modal__section academy-modal__section--grouped"
				aria-labelledby={guardianTitleId}
			>
				<SectionTitle className="academy-modal__section-title" id={guardianTitleId}>
					Родитель / законный представитель
				</SectionTitle>
				<p className="academy-modal__section-lead">
					Необязательно — для взрослых спортсменов блок можно оставить пустым.
				</p>
				<div className="academy-modal__split">
					<div className="academy-modal__split-col academy-modal__split-col--identity">
						<TextField
							useDesignKit
							id={`${idPrefix}-parent-last-name`}
							name="parent_last_name"
							label="Фамилия"
							autoComplete="family-name"
							maxLength={ATHLETE_NAME_MAX_LEN}
							value={form.parent_last_name}
							error={fieldError("parent_last_name")}
							invalid={Boolean(fieldError("parent_last_name"))}
							readOnly={fieldsDisabled}
							onChange={e => onFieldChange("parent_last_name", e.target.value)}
						/>
						<TextField
							useDesignKit
							id={`${idPrefix}-parent-first-name`}
							name="parent_first_name"
							label="Имя"
							autoComplete="given-name"
							maxLength={ATHLETE_NAME_MAX_LEN}
							value={form.parent_first_name}
							error={fieldError("parent_first_name")}
							invalid={Boolean(fieldError("parent_first_name"))}
							readOnly={fieldsDisabled}
							onChange={e => onFieldChange("parent_first_name", e.target.value)}
						/>
						<TextField
							useDesignKit
							id={`${idPrefix}-parent-patronymic`}
							name="parent_patronymic"
							label="Отчество"
							autoComplete="additional-name"
							maxLength={ATHLETE_NAME_MAX_LEN}
							value={form.parent_patronymic}
							error={fieldError("parent_patronymic")}
							invalid={Boolean(fieldError("parent_patronymic"))}
							readOnly={fieldsDisabled}
							onChange={e => onFieldChange("parent_patronymic", e.target.value)}
						/>
					</div>
					<div className="academy-modal__split-col academy-modal__split-col--contacts">
						<TextField
							useDesignKit
							id={`${idPrefix}-parent-birth-date`}
							name="parent_birth_date"
							label="Дата рождения"
							inputMode="numeric"
							placeholder="дд.мм.гггг"
							autoComplete="bday"
							value={form.parent_birth_date}
							error={fieldError("parent_birth_date")}
							invalid={Boolean(fieldError("parent_birth_date"))}
							readOnly={fieldsDisabled}
							onChange={e => onFieldChange("parent_birth_date", e.target.value)}
						/>
						<TextField
							useDesignKit
							id={`${idPrefix}-parent-phone`}
							name="parent_phone"
							label="Телефон"
							type="tel"
							autoComplete="tel"
							placeholder="+7 …"
							maxLength={ATHLETE_PHONE_INPUT_MAX_LEN}
							value={form.parent_phone}
							error={fieldError("parent_phone")}
							invalid={Boolean(fieldError("parent_phone"))}
							readOnly={fieldsDisabled}
							onChange={e => onFieldChange("parent_phone", e.target.value)}
						/>
						<p className="academy-modal__col-hint">
							С кодом страны, с «+». Пробелы и дефисы можно — сохраним только цифры после «+».
						</p>
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
					placeholder="Дополнительная информация о спортсмене"
					maxLength={ATHLETE_NOTE_MAX_LEN}
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
					maxLength={ATHLETE_NOTE_MAX_LEN}
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

export default AthleteFormFields;