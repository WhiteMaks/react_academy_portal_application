import React, {FC} from "react";
import {
	BRANCH_ADDRESS_MAX_LEN,
	BRANCH_NAME_MAX_LEN,
	BRANCH_NOTE_MAX_LEN
} from "../../../api/constants/branchFieldLimits";
import TextField from "../common/text_field/TextField";
import TextAreaField from "../common/text_area_field/TextAreaField";
import {BranchFormField, BranchFormValues} from "./branchFormTypes";

export type BranchFormFieldsProps = {
	form: BranchFormValues;
	fieldError: (field: BranchFormField) => string | undefined;
	onFieldChange: (key: keyof BranchFormValues, value: string) => void;
	idPrefix?: string;
	sectionHeading?: "h2" | "h3";
	noteAsTextarea?: boolean;
	fieldsDisabled?: boolean;
};

const BranchFormFields: FC<BranchFormFieldsProps> = ({
	form,
	fieldError,
	onFieldChange,
	idPrefix = "branch",
	sectionHeading = "h3",
	noteAsTextarea = false,
	fieldsDisabled = false
}) => {
	const SectionTitle = sectionHeading;
	const blockTitleId = `${idPrefix}-branch-block-title`;

	return (
		<div className="academy-modal__sections">
			<section className="academy-modal__section" aria-labelledby={blockTitleId}>
				<SectionTitle className="academy-modal__section-title" id={blockTitleId}>
					Филиал
				</SectionTitle>
				<TextField
					useDesignKit
					showRequiredIndicator
					required
					id={`${idPrefix}-name`}
					name="name"
					label="Название"
					autoComplete="organization"
					maxLength={BRANCH_NAME_MAX_LEN}
					value={form.name}
					error={fieldError("name")}
					invalid={Boolean(fieldError("name"))}
					readOnly={fieldsDisabled}
					onChange={e => onFieldChange("name", e.target.value)}
				/>
				<TextField
					useDesignKit
					showRequiredIndicator
					required
					id={`${idPrefix}-address`}
					name="address"
					label="Адрес"
					placeholder="Город, улица, дом"
					maxLength={BRANCH_ADDRESS_MAX_LEN}
					value={form.address}
					error={fieldError("address")}
					invalid={Boolean(fieldError("address"))}
					readOnly={fieldsDisabled}
					onChange={e => onFieldChange("address", e.target.value)}
				/>
			</section>
			{noteAsTextarea ? (
				<TextAreaField
					useDesignKit
					id={`${idPrefix}-note`}
					name="note"
					label="Примечание"
					rows={4}
					maxLength={BRANCH_NOTE_MAX_LEN}
					placeholder="Дополнительная информация о филиале"
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
					maxLength={BRANCH_NOTE_MAX_LEN}
					placeholder="Дополнительная информация о филиале"
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

export default BranchFormFields;