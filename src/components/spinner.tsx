import { cn } from "../lib/ui-helpers/cn"


export const Spinner = ({className}:{className?:string}) => {

    return (<div className={cn("inset-0 flex items-center justify-center",className)}>
        <svg className="animate-spin h-8 w-8 text-white" viewBox="0 0 24 24">
            <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
                fill="none"
            />
            <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
            />
        </svg>
    </div>)
}