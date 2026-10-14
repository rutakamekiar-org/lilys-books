import type { Metadata } from "next";
import PaymentResult from "@/components/organisms/PaymentResult";

export const metadata: Metadata = {
    title: "Результат оплати",
    robots: { index: false, follow: false },
    referrer: "no-referrer",
};

export default function PaymentPage() {
    return <PaymentResult />;
}
