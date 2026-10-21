import LegalPage, { type LegalSection } from "../components/LegalPage";
import { pageMeta } from "@/lib/seo";
import {
  LEGAL_ENTITY,
  LEGAL_EMAIL,
  LEGAL_ADDRESS,
  LEGAL_PHONE,
  LEGAL_VENUE,
} from "@/lib/legal";

export const metadata = pageMeta(
  "/terms",
  "Terms of Service | Care Licensing Solutions",
  "The terms that govern purchases and use of Care Licensing Solutions licensing bundles, templates, courses and community access."
);

const sections: LegalSection[] = [
  {
    id: "acceptance",
    title: "Agreement to These Terms",
    body: (
      <>
        <p>
          These Terms of Service (&quot;Terms&quot;) are a binding agreement between you and {LEGAL_ENTITY} (&quot;we,&quot;
          &quot;us,&quot; or &quot;our&quot;). They govern your use of this website and every product, file, course, account
          and community access you buy or receive from us (together, the &quot;Services&quot;).
        </p>
        <p>
          By visiting the site, creating an account, or completing a purchase, you confirm that you have read, understood
          and agree to these Terms, our <a href="/refund-policy">Refund Policy</a> and our{" "}
          <a href="/privacy">Privacy Policy</a>, which are part of these Terms. If you do not agree, do not use the
          Services or make a purchase.
        </p>
        <p>
          You must be at least 18 years old and able to enter a binding contract. If you buy on behalf of a company, you
          confirm you are authorized to bind that company, and &quot;you&quot; includes that company.
        </p>
      </>
    ),
  },
  {
    id: "products",
    title: "What We Sell",
    body: (
      <>
        <p>
          We sell digital, informational products for people starting or running care businesses, including
          state-specific licensing bundles (which may include a market research report, pro forma profit and loss
          template, licensing checklist, and policy and procedure manual), individual resources, and online training.
          Product contents are described on each product page and may be updated, reorganized or improved over time.
        </p>
        <p>
          Bundle purchases may include access to our online community, which is hosted by a third party (currently
          Skool). Community access is a complimentary benefit with no separate purchase price. We may change, limit,
          suspend or end community access, or move it to another platform, at any time, and the third party&apos;s own
          terms also apply to your use of it.
        </p>
      </>
    ),
  },
  {
    id: "not-advice",
    title: "Educational Information Only — Not Legal, Financial or Professional Advice",
    body: (
      <>
        <p>
          <strong>
            Our products are general educational resources and templates. They are not legal, financial, tax,
            accounting, medical, regulatory or other professional advice, and no attorney-client, consultant-client,
            fiduciary or other professional relationship is created by your purchase or use of the Services.
          </strong>
        </p>
        <p>
          Licensing laws, regulations, fees, forms, reimbursement rates and agency procedures differ by state and change
          frequently, sometimes without notice. Although we work to keep our content accurate, we do not guarantee that
          any content is complete, current or correct for your situation. You are solely responsible for confirming every
          requirement directly with the appropriate government agency and for consulting a licensed attorney, accountant
          or other qualified professional before acting on any information.
        </p>
        <p>
          We do not prepare, file or submit applications on your behalf through these products, and we are not affiliated
          with, endorsed by or acting for any government agency, regional center or licensing body.
        </p>
      </>
    ),
  },
  {
    id: "no-guarantee",
    title: "No Guarantee of Results",
    body: (
      <>
        <p>
          We do not promise or guarantee that you will obtain any license, certification, vendorization, contract,
          funding, referrals, clients, revenue or profit. Approval decisions are made solely by government agencies and
          other third parties. Your results depend on many factors outside our control, including your own effort,
          experience, finances, location and compliance.
        </p>
        <p>
          Financial projections, pro forma statements, market data and example figures are illustrative estimates based
          on assumptions that may not apply to you. They are not forecasts or promises of future performance. Any examples
          of other people&apos;s results are not typical and are not a guarantee of yours.
        </p>
      </>
    ),
  },
  {
    id: "delivery",
    title: "Accounts, Delivery and Access",
    body: (
      <>
        <p>
          After payment, we deliver access by email to the address entered at checkout, using a secure login link to your
          download dashboard. Delivery is complete when that access is sent or your account shows the purchase,
          whichever happens first. You are responsible for entering a correct email address, keeping access to that
          inbox, and keeping your login links private. You are responsible for all activity under your account.
        </p>
        <p>
          We intend to keep purchased files available in your dashboard, but we do not guarantee indefinite access. You
          should download and save your own copies promptly. We will keep purchased files available for at least twelve
          (12) months from purchase, after which access may be discontinued.
        </p>
      </>
    ),
  },
  {
    id: "license",
    title: "Your License to Use Our Materials",
    body: (
      <>
        <p>
          All products are licensed, not sold. When you pay in full, we grant you a limited, personal, non-exclusive,
          non-transferable, non-sublicensable, revocable license to use the purchased materials for the internal
          operations of one (1) care business owned or operated by you. You may edit and customize templates (such as a
          policy and procedure manual) for that one business.
        </p>
        <p>You may not, and may not allow anyone else to:</p>
        <ul>
          <li>resell, share, give away, rent, sublicense, publish, post or otherwise distribute any product or file, in whole or in part, whether edited or unedited;</li>
          <li>use the materials to provide consulting, licensing, or document-preparation services to other people or businesses;</li>
          <li>share your account, login links or downloads with anyone outside your own business;</li>
          <li>remove copyright notices, or present our materials as your own original work for sale;</li>
          <li>copy, scrape or download content in bulk, or use any content to train, test or improve any artificial intelligence or machine learning system;</li>
          <li>use the materials to build a competing product or service.</li>
        </ul>
        <p>
          Any violation automatically ends your license and your access without refund, and you remain liable for all
          damages, including our lost profits and reasonable attorneys&apos; fees, to the fullest extent permitted by law.
        </p>
      </>
    ),
  },
  {
    id: "ip",
    title: "Intellectual Property",
    body: (
      <p>
        The Services and all content, including documents, spreadsheets, reports, videos, text, graphics, logos, data
        compilations and software, are owned by us or our licensors and are protected by copyright, trademark and other
        laws. Except for the limited license above, no rights are granted to you. Feedback you send us may be used by us
        freely without obligation to you.
      </p>
    ),
  },
  {
    id: "payment",
    title: "Pricing, Payment and Promotions",
    body: (
      <>
        <p>
          Prices are listed in U.S. dollars and may change at any time before you purchase. Payment is processed by our
          payment provider (currently Stripe); we do not store your full card number. You authorize us to charge your
          payment method the total shown at checkout. You are responsible for any taxes, bank fees or currency charges
          that apply to you.
        </p>
        <p>
          Promotional and discount codes have no cash value, cannot be combined unless we say so, may expire or be
          withdrawn at any time, and may be cancelled if obtained or used improperly. Purchases made with a code that was
          not intended for you may be cancelled and access revoked. We may refuse or cancel any order, including for
          suspected fraud, abuse or pricing errors, and will refund any amount charged for an order we cancel.
        </p>
      </>
    ),
  },
  {
    id: "refunds",
    title: "Refunds",
    body: (
      <p>
        Because our products are digital and delivered immediately, <strong>all sales are final</strong> once access
        is delivered, except for the limited situations described in our <a href="/refund-policy">Refund Policy</a>,
        which is part of these Terms.
      </p>
    ),
  },
  {
    id: "chargebacks",
    title: "Payment Disputes and Chargebacks",
    body: (
      <>
        <p>
          If you have a problem with a purchase, you agree to contact us first at{" "}
          <a href={`mailto:${LEGAL_EMAIL}`}>{LEGAL_EMAIL}</a> and give us at least ten (10) business days to resolve it
          before disputing the charge with your bank or card issuer.
        </p>
        <p>
          You agree not to file a chargeback for a purchase that was delivered as described. If you do, we may submit
          evidence of your purchase, your acceptance of these Terms, delivery records, account and download activity,
          IP addresses and communications to contest it. While a dispute is open, and permanently if the dispute is
          resolved in our favor or found to be improper, we may suspend or end your access to all Services. To the
          extent permitted by law, you agree to reimburse our reasonable costs of responding to an improper chargeback,
          including dispute fees.
        </p>
      </>
    ),
  },
  {
    id: "communications",
    title: "Email and Text Communications",
    body: (
      <>
        <p>
          By purchasing or creating an account, you agree to receive transactional messages about your order and
          account, such as receipts and login links. If you provide your email address to us, we may also send marketing
          emails, and you can unsubscribe at any time using the link in any such email.
        </p>
        <p>
          If you provide your mobile number and agree to receive text messages, you consent to receive recurring
          marketing and informational text messages from {LEGAL_ENTITY}, which may be sent using automated technology.
          Consent is not a condition of any purchase. Message frequency varies. Message and data rates may apply. Reply
          STOP to opt out or HELP for help. Carriers are not liable for delayed or undelivered messages.
        </p>
      </>
    ),
  },
  {
    id: "conduct",
    title: "Acceptable Use",
    body: (
      <p>
        You agree not to misuse the Services, including by attempting to gain unauthorized access, interfering with the
        site&apos;s operation, introducing malicious code, using bots or scrapers, making false statements, harassing our
        staff or community members, or violating any law. We may suspend or end your access, without refund, if we
        reasonably believe you have violated these Terms.
      </p>
    ),
  },
  {
    id: "third-parties",
    title: "Third-Party Services and Links",
    body: (
      <p>
        The Services rely on and may link to third-party services, such as payment processors, hosting providers,
        email providers, community platforms and government websites. We do not control and are not responsible for
        third-party services, content, policies or availability, and your use of them is at your own risk and subject to
        their terms.
      </p>
    ),
  },
  {
    id: "warranties",
    title: "Disclaimer of Warranties",
    body: (
      <p className="uppercase text-[13px] leading-6">
        To the fullest extent permitted by law, the services and all products and content are provided &quot;as is&quot;
        and &quot;as available,&quot; with all faults and without warranties of any kind, express, implied or statutory,
        including any implied warranties of merchantability, fitness for a particular purpose, title, non-infringement,
        accuracy, completeness or that the services will be uninterrupted, timely, secure or error-free. You use the
        services and rely on any content entirely at your own risk.
      </p>
    ),
  },
  {
    id: "liability",
    title: "Limitation of Liability",
    body: (
      <>
        <p className="uppercase text-[13px] leading-6">
          To the fullest extent permitted by law, we and our owners, officers, employees, contractors and affiliates
          will not be liable for any indirect, incidental, special, consequential, exemplary or punitive damages, or for
          any lost profits, lost revenue, lost business opportunities, denied or delayed licenses or applications, fines,
          penalties, regulatory actions, loss of data or business interruption, arising out of or relating to the
          services or these terms, under any legal theory, even if advised of the possibility of such damages.
        </p>
        <p className="uppercase text-[13px] leading-6">
          Our total liability for all claims arising out of or relating to the services or these terms will not exceed
          the amount you actually paid us for the specific product giving rise to the claim during the twelve (12) months
          before the claim arose.
        </p>
        <p>
          Some jurisdictions do not allow certain exclusions or limitations, so some of the above may not apply to you, but
          they apply to the fullest extent permitted.
        </p>
      </>
    ),
  },
  {
    id: "indemnity",
    title: "Indemnification",
    body: (
      <p>
        You agree to defend, indemnify and hold harmless {LEGAL_ENTITY} and its owners, officers, employees, contractors
        and affiliates from any claims, losses, liabilities, damages, fines, costs and expenses (including reasonable
        attorneys&apos; fees) arising out of or relating to your use of the Services or our materials, your business
        operations, your applications or submissions to any agency, your breach of these Terms, or your violation of any
        law or the rights of another person.
      </p>
    ),
  },
  {
    id: "disputes",
    title: "Dispute Resolution, Arbitration and Class Action Waiver",
    body: (
      <>
        <p>
          <strong>Please read this section carefully. It affects your legal rights.</strong>
        </p>
        <p>
          <strong>Informal resolution first.</strong> Before starting any formal proceeding, you agree to email us a
          written description of your claim and the relief you want, and to try in good faith to resolve it with us for
          at least thirty (30) days.
        </p>
        <p>
          <strong>Binding arbitration.</strong> Any dispute, claim or controversy arising out of or relating to these
          Terms or the Services that is not resolved informally will be resolved by final and binding individual
          arbitration administered by the American Arbitration Association under its applicable rules (the Consumer
          Arbitration Rules for individual consumers, otherwise the Commercial Arbitration Rules). The arbitration will
          take place in {LEGAL_VENUE}, or by video or written submissions if the arbitrator allows. The arbitrator&apos;s
          decision may be entered as a judgment in any court with jurisdiction. The Federal Arbitration Act governs this
          section. Either party may instead bring an individual claim in small claims court in {LEGAL_VENUE} if it
          qualifies, and either party may seek a court order to stop infringement or misuse of intellectual property.
        </p>
        <p>
          <strong>Class action and jury waiver.</strong> You and we each agree to bring claims only in an individual
          capacity, and not as a plaintiff or class member in any class, collective, consolidated or representative
          proceeding. The arbitrator may not consolidate claims or award relief on a class basis. You and we each waive
          any right to a jury trial.
        </p>
        <p>
          <strong>Time limit.</strong> To the extent permitted by law, any claim must be filed within one (1) year after
          it arises, or it is permanently barred.
        </p>
        <p>
          <strong>Opt-out.</strong> You may opt out of this arbitration agreement by emailing{" "}
          <a href={`mailto:${LEGAL_EMAIL}`}>{LEGAL_EMAIL}</a> within thirty (30) days of your first purchase, with your
          name, purchase email and a clear statement that you opt out of arbitration. If you opt out, or if this section
          is found unenforceable, disputes will be resolved exclusively in the state or federal courts located in{" "}
          {LEGAL_VENUE}, and you consent to their jurisdiction.
        </p>
      </>
    ),
  },
  {
    id: "law",
    title: "Governing Law",
    body: (
      <p>
        These Terms are governed by the laws of the State of California, without regard to conflict-of-law rules, except
        that the Federal Arbitration Act governs the arbitration section.
      </p>
    ),
  },
  {
    id: "changes",
    title: "Changes and Termination",
    body: (
      <>
        <p>
          We may update these Terms at any time by posting a new version on this page with a new effective date. Changes
          apply to purchases and use after they are posted. Your continued use of the Services means you accept the
          updated Terms.
        </p>
        <p>
          We may modify, suspend or discontinue any part of the Services at any time. Sections that by their nature
          should survive termination, including license restrictions, intellectual property, payment, disclaimers,
          limitation of liability, indemnification and dispute resolution, will survive.
        </p>
      </>
    ),
  },
  {
    id: "general",
    title: "General Terms",
    body: (
      <p>
        These Terms, together with the Refund Policy and Privacy Policy, are the entire agreement between you and us about
        the Services. If any provision is found unenforceable, it will be enforced to the maximum extent permitted and the
        rest will remain in effect. Our failure to enforce a provision is not a waiver. You may not assign these Terms
        without our written consent; we may assign them freely, including in a sale of our business. We are not liable
        for delays or failures caused by events beyond our reasonable control. Electronic acceptance of these Terms is as
        binding as a signature.
      </p>
    ),
  },
  {
    id: "california",
    title: "Notice to California Residents",
    body: (
      <p>
        Under California Civil Code Section 1789.3, California users are entitled to the following notice: the Complaint
        Assistance Unit of the Division of Consumer Services of the California Department of Consumer Affairs may be
        contacted in writing at 1625 North Market Blvd., Suite N 112, Sacramento, CA 95834, or by telephone at (800)
        952-5210.
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

export default function TermsPage() {
  return (
    <LegalPage
      title="Terms of Service"
      intro={
        <p>
          Please read these Terms carefully before buying. They include an <strong>all-sales-final refund policy</strong>,
          a <strong>disclaimer that our products are not legal or professional advice</strong>, limits on our liability,
          and a <a href="#disputes">binding arbitration agreement and class action waiver</a>.
        </p>
      }
      sections={sections}
    />
  );
}
