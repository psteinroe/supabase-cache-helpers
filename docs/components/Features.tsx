import { useId } from "react";
import styles from "./features.module.css";

export type FeatureProps = { text: string };

export function Feature({ text }: FeatureProps) {
    return (
        <div className={styles.feature}>
            <h4>{text}</h4>
        </div>
    );
}

const FEATURES_LIST = [
    { name: "Queries" },
    { name: "Mutations" },
    { name: "Subscriptions" },
    { name: "Realtime" },
    { name: "PostgREST" },
    { name: "Storage" },
    { name: "Pagination" },
    { name: "Infinite Scroll" },
];

export default function Features() {
    const keyId = useId();

    return (
        <div className="mx-auto max-w-full w-[880px] text-center px-4 mb-10">
            <p className="text-lg mb-2 text-gray-600 md:!text-2xl">
                A collection of framework specific Cache utilities for working with
                Supabase
            </p>
            <div className={styles.features}>
                {FEATURES_LIST.map(({ name }) => (
                    <Feature text={name} key={keyId + name} />
                ))}
            </div>
        </div>
    );
}
