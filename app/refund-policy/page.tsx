import LegalPage, { type LegalSection } from "../components/LegalPage";
import { pageMeta } from "@/lib/seo";
import { LEGAL_ENTITY, LEGAL_EMAIL } from "@/lib/legal";

export const metadata = pageMeta(
  "/refund-policy",
  "Refund Policy | Care Licensing Solutions",
  "Care Licensing Solutions sells instantly delivered digital products. All sales are final once access is delivered, with limited exceptions."
);

const sections: LegalSection[] = [
  {
    id: "final",
    title: "All Sales Are Final",
    body: (
      <>
        <p>
          Our licensing bundles, individual resources and courses are digital products. You receive immediate access
          to the full files and content as soon as your payment goes through, and that access cannot be returned or
          taken back. For that reason, <strong>all sales are final and non-refundable once access has been delivered</strong>,
          except in the limited situations listed below.
        </p>
        <p>
          Access is considered delivered when we send your login link to the email address you entered at checkout,
          or when the purchase appears in your account dashboard, whichever happens first.
        </p>
        <p>By completing a purchase, you acknowledge and agree to this policy.</p>
      </>
    ),
  },
  {
    id: "exceptions",
    title: "When We Will Issue a Refund",
    body: (
      <>
        <p>We will refund a purchase only if one of the following applies:</p>
        <ul>
          <li>
            <strong>Duplicate charge.</strong> You were charged more than once for the same product. We will refund the
            duplicate charge.
          </li>
          <li>
            <strong>Never received access.</strong> You were charged but never received access, and we are unable to
            restore your access within five (5) business days after you contact us.
          </li>
          <li>
            <strong>Defective file.</strong> A file you purchased is missing, will not open or is corrupted, and we are
            unable to fix or replace it within five (5) business days after you report it. The refund will be for the
            affected item only, based on its listed individual price, not the whole order.
          </li>
        </ul>
        <p>
          These requests must be made within fourteen (14) days of your purchase date. These are your sole and exclusive
          remedies for any problem with a purchase.
        </p>
      </>
    ),
  },
  {
    id: "not-eligible",
    title: "What Is Not Eligible for a Refund",
    body: (
      <>
        <p>Refunds are not available for reasons including:</p>
        <ul>
          <li>changing your mind, no longer needing the product, or not using it;</li>
          <li>not reading the product description before buying, or expecting content that was not described;</li>
          <li>buying the wrong state or program type (see exchanges below);</li>
          <li>your license, certification, vendorization or application being denied, delayed or not pursued;</li>
          <li>changes in state laws, regulations, fees, forms or agency procedures after your purchase;</li>
          <li>disagreement with financial estimates, market data or other projections;</li>
          <li>dissatisfaction with, or changes to, complimentary community access;</li>
          <li>account suspension or termination for violating our Terms of Service.</li>
        </ul>
      </>
    ),
  },
  {
    id: "exchanges",
    title: "Wrong State or Program Type",
    body: (
      <p>
        If you bought the wrong state or program by mistake, contact us within seven (7) days of purchase. At our sole
        discretion, we may exchange it for a different state or program of equal or lesser price. Exchanges are a
        courtesy, not a right, and are not available if we believe the original files have been shared or used.
        Exchanges are not refunds and no money will be returned.
      </p>
    ),
  },
  {
    id: "courses",
    title: "Courses and Community Access",
    body: (
      <p>
        Online course purchases are final once enrollment and access are granted. Community access included with a
        bundle is a complimentary benefit with no separate value and does not create any right to a refund.
      </p>
    ),
  },
  {
    id: "how",
    title: "How to Request a Refund or Exchange",
    body: (
      <>
        <p>
          Email <a href={`mailto:${LEGAL_EMAIL}`}>{LEGAL_EMAIL}</a> or use our <a href="/contact">contact page</a> with
          the email address used at checkout, the product name, the date of purchase and a description of the problem.
          For defective files, please tell us which file and what happens when you open it.
        </p>
        <p>
          Approved refunds are issued to the original payment method. Your bank may take 5 to 10 business days to post
          it. When a refund is issued, your license ends and access to the refunded product is removed.
        </p>
      </>
    ),
  },
  {
    id: "disputes",
    title: "Contact Us Before Disputing a Charge",
    body: (
      <p>
        Please contact us before filing a dispute or chargeback with your bank. Most issues, such as a missing login
        link, are fixed the same day. Under our <a href="/terms#chargebacks">Terms of Service</a>, you agree to give us
        at least ten (10) business days to resolve a problem first. If a chargeback is filed on a delivered order, we
        will provide your purchase, delivery and account records to your bank, and your access may be suspended.
      </p>
    ),
  },
  {
    id: "law",
    title: "Your Legal Rights",
    body: (
      <p>
        This policy is part of the {LEGAL_ENTITY} <a href="/terms">Terms of Service</a>. Nothing in this policy limits
        any right you may have under applicable law that cannot be waived by agreement.
      </p>
    ),
  },
];

export default function RefundPolicyPage() {
  return (
    <LegalPage
      title="Refund Policy"
      intro={
        <p>
          <strong>Short version:</strong> our products are digital and delivered instantly, so all sales are final once
          you receive access. We fix problems fast, and we refund duplicate charges, orders that were never delivered, and
          files we cannot fix. Questions? <a href="/contact">Contact us</a> before you buy.
        </p>
      }
      sections={sections}
    />
  );
}
