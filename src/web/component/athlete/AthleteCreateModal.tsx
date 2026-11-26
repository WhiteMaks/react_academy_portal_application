import React, {FC, FormEvent, useEffect, useRef, useState} from "react";
import PostAthleteV1Request from "../../../api/models/athlete/PostAthleteV1Request";
import DesignForm from "../common/design_form/DesignForm";
import {FORM_CHECK_BANNER, focusFirstFieldByName} from "../common/design_form/formContract";
import FormCheckBanner from "../common/form_check_banner/FormCheckBanner";
import AthleteFormFields from "./AthleteFormFields";
import {
	ATHLETE_FIELD_FOCUS_ORDER,
	AthleteFormField,
	AthleteFormFieldErrors,
	AthleteFormValues,
	EMPTY_ATHLETE_FORM
} from "./athleteFormTypes";
import {clearAthleteFieldErrorsOnChange, updateAthleteFormValue} from "./athleteFormFieldUtils";
import {validateAthleteForm} from "./athleteFormValidate";

export type AthleteCreateModalProps = {
	open: boolean;
	submitting: boolean;
	bannerError?: string | null;
	onClose: () => void;
	onSubmit: (body: PostAthleteV1Request) => void;
	serverFieldErrors?: AthleteFormFieldErrors;
	onClearServerErrors?: () => void;
};

const FOCUSABLE =
	'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])';

const AthleteCreateModal: FC<AthleteCreateModalProps> = ({
	open,
	submitting,
	bannerError,
	onClose,
	onSubmit,
	serverFieldErrors,
	onClearServerErrors
}) => {
	const [form, setForm] = useState<AthleteFormValues>(EMPTY_ATHLETE_FORM);
	const [clientErrors, setClientErrors] = useState<AthleteFormFieldErrors>({});
	const [formCheckBanner, setFormCheckBanner] = useState<string | null>(null);
	const titleRef = useRef<HTMLHeadingElement>(null);
	const dialogRef = useRef<HTMLDivElement>(null);
	const returnFocusRef = useRef<HTMLElement | null>(null);

	const fieldError = (field: AthleteFormField): string | undefined =>
		clientErrors[field] ?? serverFieldErrors?.[field];

	const wasOpenRef = useRef(false);

	useEffect(() => {
		if (open && !wasOpenRef.current) {
			returnFocusRef.current = document.activeElement as HTMLElement | null;
			setForm(EMPTY_ATHLETE_FORM);
			setClientErrors({});
			setFormCheckBanner(null);
			onClearServerErrors?.();
			window.requestAnimationFrame(() => titleRef.current?.focus());
		}
		wasOpenRef.current = open;
	}, [open, onClearServerErrors]);

	useEffect(() => {
		if (open) return;
		const el = returnFocusRef.current;
		if (el && typeof el.focus === "function") el.focus();
	}, [open]);

	useEffect(() => {
		if (!open) return;
		const onKey = (event: KeyboardEvent) => {
			if (event.key === "Escape" && !submitting) {
				event.preventDefault();
				onClose();
			}
			if (event.key === "Tab" && dialogRef.current) {
				const nodes = dialogRef.current.querySelectorAll<HTMLElement>(FOCUSABLE);
				if (nodes.length === 0) return;
				const first = nodes[0];
				const last = nodes[nodes.length - 1];
				if (event.shiftKey && document.activeElement === first) {
					event.preventDefault();
					last.focus();
				} else if (!event.shiftKey && document.activeElement === last) {
					event.preventDefault();
					first.focus();
				}
			}
		};
		document.addEventListener("keydown", onKey);
		return () => document.removeEventListener("keydown", onKey);
	}, [open, onClose, submitting]);

	const focusFirstInvalidField = (errors: AthleteFormFieldErrors) => {
		const names = ATHLETE_FIELD_FOCUS_ORDER.filter(field => errors[field]);
		focusFirstFieldByName(dialogRef.current, names);
	};

	const onFieldChange = (key: keyof AthleteFormValues, value: string) => {
		setForm(prev => updateAthleteFormValue(prev, key, value));
		setClientErrors(prev => clearAthleteFieldErrorsOnChange(prev, key));
		setFormCheckBanner(null);
	};

	const handleSubmit = (event: FormEvent) => {
		event.preventDefault();
		if (submitting) return;
		onClearServerErrors?.();
		const result = validateAthleteForm(form);
		if (!result.ok) {
			setClientErrors(result.errors);
			setFormCheckBanner(FORM_CHECK_BANNER);
			focusFirstInvalidField(result.errors);
			return;
		}
		setClientErrors({});
		setFormCheckBanner(null);
		onSubmit(result.body);
	};

	if (!open) return null;

	return (
		<div
			className="academy-modal-backdrop academy-modal-backdrop--open"
			role="presentation"
			onMouseDown={event => {
				if (event.target === event.currentTarget && !submitting) onClose();
			}}
		>
			<div
				className="academy-modal"
				role="dialog"
				aria-modal="true"
				aria-labelledby="athlete-modal-title"
				ref={dialogRef}
			>
				<header className="academy-modal__head">
					<h2 id="athlete-modal-title" tabIndex={-1} ref={titleRef}>
						Добавить спортсмена
					</h2>
					<button
						type="button"
						className="academy-modal__close"
						aria-label="Закрыть"
						disabled={submitting}
						onClick={onClose}
					>
						×
					</button>
				</header>
				<DesignForm onSubmit={handleSubmit}>
					{formCheckBanner ? <FormCheckBanner message={formCheckBanner}/> : null}
					{bannerError && !formCheckBanner ? <FormCheckBanner message={bannerError}/> : null}
					{(clientErrors.parent_block ?? serverFieldErrors?.parent_block) ? (
						<FormCheckBanner message={clientErrors.parent_block ?? serverFieldErrors?.parent_block ?? ""}/>
					) : null}
					<AthleteFormFields
						form={form}
						fieldError={fieldError}
						onFieldChange={onFieldChange}
						idPrefix="athlete-create"
					/>
					<footer className="academy-modal__actions">
						<button type="button" className="btn" disabled={submitting} onClick={onClose}>
							Отмена
						</button>
						<button type="submit" className="btn btn--gold" disabled={submitting}>
							Сохранить
						</button>
					</footer>
				</DesignForm>
			</div>
		</div>
	);
};

export default AthleteCreateModal;