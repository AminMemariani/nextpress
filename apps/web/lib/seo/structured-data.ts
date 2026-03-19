/**
 * Structured Data React component.
 *
 * Renders JSON-LD as a <script> tag in the document head.
 * Used by templates that want to add structured data inline
 * (in addition to the metadata API approach).
 */

export function JsonLd({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
