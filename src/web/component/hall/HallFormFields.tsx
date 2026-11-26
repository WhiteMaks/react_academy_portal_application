import React, {FC, useMemo} from "react";
import {
	HALL_CAPACITY_MAX,
	HALL_CAPACITY_MIN,
	HALL_NAME_MAX_LEN,
	HALL_NOTE_MAX_LEN,
	HALL_SUBTITLE_MAX_LEN
} from "../../../api/constants/hallFieldLimits";
import TextField from "../common/text_field/TextField";
import TextAreaField from "../common/text_area_field/TextAreaField";
import {formatHallCapacity} from "../../util/infrastructureDisplay";
import {HallFormField, HallFormValues} from "./hallFormTypes";

export type HallFormFieldsProps = {
	form: HallFormValues;
	fieldError: (field: HallFormField) => string | undefined;
	onFieldChange: (key: keyof HallFormValues, value: string) => void;
	idPrefix?: string;
	sectionHeading?: "h2" | "h3";
	noteAsTextarea?: boolean;
	fieldsDisabled?: boolean;
	showCapacityHint?: boolean;
};

const HallFormFields: FC<HallFormFieldsProps> = ({
	form,
	fieldError,
	onFieldChange,
	idPrefix = "hall",
	sectionHeading = "h3",
	noteAsTextarea = false,
	fieldsDisabled = false,
	showCapacityHint = false
}) => {
	const SectionTitle = sectionHeading;
	const blockTitleId = `${idPrefix}-hall-block-title`;

	const capacityHint = useMemo(() => {
		if (!showCapacityHint) return null;
		const raw = form.capacity.trim();
		const n = Number(raw);
		if (!Number.isInteger(n) || n < HALL_CAPACITY_MIN || n > HALL_CAPACITY_MAX) return null;
		return formatHallCapacity(n);
	}, [form.capacity, showCapacityHint]);

	return (
		<div className="academy-modal__sections">
			<section className="academy-modal__section" aria-labelledby={blockTitleId}>
				<SectionTitle className="academy-modal__section-title" id={blockTitleId}>
					Спортзал
				</SectionTitle>
				<TextField
					useDesignKit
					showRequiredIndicator
					required
					id={`${idPrefix}-name`}
					name="name"
					label="Название"
					maxLength={HALL_NAME_MAX_LEN}
					value={form.name}
					error={fieldError("name")}
					invalid={Boolean(fieldError("name"))}
					readOnly={fieldsDisabled}
					onChange={e => onFieldChange("name", e.target.value)}
				/>
				<TextField
					useDesignKit
					id={`${idPrefix}-subtitle`}
					name="subtitle"
					label="Краткое описание"
					placeholder="Например: основной зал единоборств"
					maxLength={HALL_SUBTITLE_MAX_LEN}
					value={form.subtitle}
					error={fieldError("subtitle")}
					invalid={Boolean(fieldError("subtitle"))}
					readOnly={fieldsDisabled}
					onChange={e => onFieldChange("subtitle", e.target.value)}
				/>
				<TextField
					useDesignKit
					showRequiredIndicator
					required
					type="number"
					inputMode="numeric"
					id={`${idPrefix}-capacity`}
					name="capacity"
					label="Вместимость"
					placeholder="Количество человек"
					value={form.capacity}
					error={fieldError("capacity")}
					invalid={Boolean(fieldError("capacity"))}
					readOnly={fieldsDisabled}
					onChange={e => onFieldChange("capacity", e.target.value)}
				/>
				{capacityHint ? (
					<p className="halls-detail__capacity-hint" id={`${idPrefix}-capacity-display`}>
						{capacityHint}
					</p>
				) : null}
			</section>
			{noteAsTextarea ? (
				<TextAreaField
					useDesignKit
					id={`${idPrefix}-note`}
					name="note"
					label="Примечание"
					rows={4}
					maxLength={HALL_NOTE_MAX_LEN}
					placeholder="Оборудование, особенности площадки"
					value={form.note}
					error={fieldError("note")}
					invalid={Boolean(fieldError("note"))}
					readOnly={fieldsDisabled}
					onChange={e => onFieldChange("note", e.target.value)}
				/>
			) : (
				<TextAreaField
					useDesignKit
					id={`${idPrefix}-note`}
					name="note"
					label="Примечание"
					rows={3}
					maxLength={HALL_NOTE_MAX_LEN}
					placeholder="Оборудование, особенности площадки"
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

export default HallFormFields;