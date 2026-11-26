import React, {createContext, FC, ReactNode, useCallback, useContext, useMemo, useState} from "react";

export type CrumbSegment = {
	label: string;
	href?: string;
};

type ShellChromeContextValue = {
	mobileTitleOverride: string | null;
	setMobileTitleOverride: (title: string | null) => void;
	crumbTrail: CrumbSegment[] | null;
	setCrumbTrail: (trail: CrumbSegment[] | null) => void;
};

const ShellChromeContext = createContext<ShellChromeContextValue | undefined>(undefined);

export const ShellChromeProvider: FC<{children: ReactNode}> = ({children}) => {
	const [mobileTitleOverride, setMobileTitleOverride] = useState<string | null>(null);
	const [crumbTrail, setCrumbTrail] = useState<CrumbSegment[] | null>(null);

	const value = useMemo(
		() => ({mobileTitleOverride, setMobileTitleOverride, crumbTrail, setCrumbTrail}),
		[mobileTitleOverride, crumbTrail]
	);

	return <ShellChromeContext.Provider value={value}>{children}</ShellChromeContext.Provider>;
};

export const useShellChrome = (): ShellChromeContextValue => {
	const ctx = useContext(ShellChromeContext);
	if (!ctx) throw new Error("useShellChrome must be used within ShellChromeProvider");
	return ctx;
};

export const useShellPageChrome = (options: {
	mobileTitle?: string | null;
	crumbTrail?: CrumbSegment[] | null;
}): void => {
	const {setMobileTitleOverride, setCrumbTrail} = useShellChrome();
	const mobileTitle = options.mobileTitle ?? null;
	const crumbTrail = options.crumbTrail ?? null;

	React.useEffect(() => {
		setMobileTitleOverride(mobileTitle);
		setCrumbTrail(crumbTrail);
		return () => {
			setMobileTitleOverride(null);
			setCrumbTrail(null);
		};
	}, [mobileTitle, crumbTrail, setMobileTitleOverride, setCrumbTrail]);
};

export const useShellPageChromeSetter = () => {
	const {setMobileTitleOverride, setCrumbTrail} = useShellChrome();
	return useCallback(
		(mobileTitle: string | null, crumbTrail: CrumbSegment[] | null) => {
			setMobileTitleOverride(mobileTitle);
			setCrumbTrail(crumbTrail);
		},
		[setMobileTitleOverride, setCrumbTrail]
	);
};