import LegalPage, { type LegalSection } from "../components/LegalPage";
import { pageMeta } from "@/lib/seo";
import { LEGAL_ENTITY, LEGAL_EMAIL, LEGAL_ADDRESS, LEGAL_PHONE } from "@/lib/legal";

export const metadata = pageMeta(
  "/privacy",
  "Privacy Policy | Care Licensing Solutions",
  "How Care Licensing Solutions collects, uses and protects your personal information, and the choices you have."
);

const sections: LegalSection[] = [
  {
    id: "scope",
    title: "Who We Are and What This Covers",
    body: (
      <p>
        This Privacy Policy explains how {LEGAL_ENTITY} (&quot;we,&quot; &quot;us,&quot; &quot;our&quot;) collects, uses,
        shares and protects personal information when you visit this website, fill out our forms, buy our products, join
        our community, or communicate with us by email, phone or text. This policy is part of our{" "}
        <a href="/terms">Terms of Service</a>.
      </p>
    ),
  },
  {
    id: "collect",
    title: "Information We Collect",
    body: (
      <>
        <p>
          <strong>Information you give us:</strong> your name, email address, phone number, company name, the state and
          type of care business you are interested in, answers you give on applications or questionnaires, and anything
          you send us in messages.
        </p>
        <p>
          <strong>Purchase information:</strong> the products you buy, order amounts, discount codes and transaction
          records. Card payments are processed directly by our payment provider (Stripe). We do not receive or store your
          full card number.
        </p>
        <p>
          <strong>Information collected automatically:</strong> IP address, browser and device type, pages viewed,
          referring pages, dates and times of visits, login and download activity, and similar usage data, collected
          through server logs, cookies, browser storage (for example, to remember your cart) and similar technologies.
        </p>
        <p>
          <strong>Information from others:</strong> information from our service providers and partners, such as lead
          forms, scheduling tools, our customer relationship management system, our community platform and advertising
          platforms.
        </p>
      </>
    ),
  },
  {
    id: "use",
    title: "How We Use Information",
    body: (
      <ul>
        <li>to process orders, deliver products, create and secure your account, and send login links and receipts;</li>
        <li>to provide customer support and respond to your requests;</li>
        <li>to send you information, offers and updates by email and, with your consent, by text message;</li>
        <li>to recommend products relevant to your state and program type;</li>
        <li>to understand how the site is used and to improve our products, content and marketing;</li>
        <li>to prevent fraud, enforce our Terms, protect our content, and respond to payment disputes and chargebacks;</li>
        <li>to comply with law and protect our rights and the safety of others.</li>
      </ul>
    ),
  },
  {
    id: "share",
    title: "How We Share Information",
    body: (
      <>
        <p>
          <strong>We do not sell your personal information for money.</strong> We share it only as follows:
        </p>
        <ul>
          <li>
            <strong>Service providers</strong> who help us run the business, such as payment processing (Stripe),
            website hosting and databases (Vercel, Supabase), email delivery, our CRM and messaging platform
            (GoHighLevel), our community platform (Skool), and analytics or advertising tools. They may use your
            information only to provide services to us.
          </li>
          <li>
            <strong>Legal and safety reasons</strong>, when required by law or legal process, or to protect our rights,
            property, users or others, including in payment disputes.
          </li>
          <li>
            <strong>Business transfers</strong>, as part of a merger, sale, financing or transfer of all or part of our
            business.
          </li>
          <li>
            <strong>With your consent</strong> or at your direction.
          </li>
        </ul>
      </>
    ),
  },
  {
    id: "sms",
    title: "Text Messaging",
    body: (
      <>
        <p>
          If you give us your mobile number and opt in, we may send you text messages about your inquiry, purchases and
          offers. Message frequency varies. Message and data rates may apply. Reply STOP to unsubscribe or HELP for help
          at any time. Consent to receive texts is not a condition of purchase.
        </p>
        <p>
          <strong>
            No mobile information will be shared with third parties or affiliates for marketing or promotional purposes.
            Text messaging originator opt-in data and consent will not be shared with any third parties.
          </strong>{" "}
          This does not apply to the service providers that send messages on our behalf.
        </p>
      </>
    ),
  },
  {
    id: "cookies",
    title: "Cookies, Advertising and Do Not Track",
    body: (
      <>
        <p>
          We and our service providers use cookies and similar technologies to keep you signed in, remember your cart,
          understand site usage and, where we run advertising, measure and improve our ads on platforms such as Google
          and Meta. You can block or delete cookies in your browser settings, though some features may not work without
          them. You can also adjust ad preferences in your Google and Meta account settings.
        </p>
        <p>
          Some browsers send &quot;Do Not Track&quot; signals. Because there is no common standard for these signals, our
          site does not currently respond to them.
        </p>
      </>
    ),
  },
  {
    id: "retention",
    title: "How Long We Keep Information",
    body: (
      <p>
        We keep personal information for as long as needed to provide the Services, maintain your purchase history and
        access, meet tax, accounting and legal obligations, resolve disputes and enforce our agreements. Purchase and
        transaction records are generally kept for at least seven (7) years.
      </p>
    ),
  },
  {
    id: "security",
    title: "Security",
    body: (
      <p>
        We use reasonable administrative, technical and physical safeguards, including encrypted connections and
        restricted access to account and file storage. No method of transmission or storage is completely secure, and we
        cannot guarantee absolute security. Keep your login links private and tell us right away if you suspect
        unauthorized access.
      </p>
    ),
  },
  {
    id: "choices",
    title: "Your Choices",
    body: (
      <ul>
        <li>Unsubscribe from marketing emails using the link in any email.</li>
        <li>Reply STOP to any text message to stop texts.</li>
        <li>
          Ask us to access, correct or delete your personal information by emailing{" "}
          <a href={`mailto:${LEGAL_EMAIL}`}>{LEGAL_EMAIL}</a>. We may need to verify your identity, and we may keep
          information we are required or permitted by law to keep, such as transaction records.
        </li>
      </ul>
    ),
  },
  {
    id: "california",
    title: "California and Other State Privacy Rights",
    body: (
      <>
        <p>
          Depending on where you live and whether the law applies to our business, you may have the right to know what
          personal information we collect, use and disclose; to request a copy; to request correction or deletion; and to
          opt out of the sale or sharing of personal information for targeted advertising. We will not discriminate
          against you for exercising these rights. To make a request, email{" "}
          <a href={`mailto:${LEGAL_EMAIL}`}>{LEGAL_EMAIL}</a> with the subject line &quot;Privacy Request.&quot; You may use
          an authorized agent, and we may ask for proof of authorization.
        </p>
        <p>
          California residents may also request information about any disclosure of personal information to third
          parties for their own direct marketing purposes under California Civil Code Section 1798.83. We do not make
          such disclosures.
        </p>
      </>
    ),
  },
  {
    id: "children",
    title: "Children",
    body: (
      <p>
        Our Services are for adults starting or operating businesses and are not directed to anyone under 18. We do not
        knowingly collect personal information from children. If you believe a child has given us information, contact us
        and we will delete it.
      </p>
    ),
  },
  {
    id: "us",
    title: "Data Location",
    body: (
      <p>
        We are based in the United States and store and process information in the United States. If you access the
        Services from outside the U.S., you consent to your information being transferred to and processed in the U.S.
      </p>
    ),
  },
  {
    id: "changes",
    title: "Changes to This Policy",
    body: (
      <p>
        We may update this policy by posting a new version on this page with a new effective date. Your continued use of
        the Services after an update means you accept it.
      </p>
    ),
  },
  {
    id: "contact",
    title: "Contact Us",
    body: (
      <p>
        {LEGAL_ENTITY}
        <br />
        {LEGAL_ADDRESS}
        <br />
        Email: <a href={`mailto:${LEGAL_EMAIL}`}>{LEGAL_EMAIL}</a>
        <br />
        Phone: {LEGAL_PHONE}
      </p>
    ),
  },
];

export default function PrivacyPage() {
  return (
    <LegalPage
      title="Privacy Policy"
      intro={
        <p>
          We collect the information needed to sell and deliver our products, support you and tell you about relevant
          resources. We do not sell your personal information, and we never share your text-message opt-in with third
          parties for their marketing.
        </p>
      }
      sections={sections}
    />
  );
}
