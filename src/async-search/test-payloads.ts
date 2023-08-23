export const asyncSearchHandlerTestPayload = {
  signature:
    'Signature:  namespace="g2p", kidId="{sender_id}|{unique_key_id}|{algorithm}", algorithm="ed25519", created="1606970629", expires="1607030629", headers="(created) (expires) digest", signature="Base64(signing content)',
  header: {
    version: "0.1.0",
    message_id: "123",
    message_ts: "",
    action: "search",
    sender_id: "spp.example.org",
    sender_uri: "https://spp.example.org/{namespace}/callback/on-search",
    receiver_id: "pymts.example.org",
    total_count: 21800,
    encryption_algo: ["aes", "rsa", "aes+rsa", "ecc", "other"],
  },
  message: {
    transaction_id: 123456789012345,
    search_request: [
      {
        reference_id: "123456789012345",
        timestamp: "",
        registry_type: [
          "civil",
          "population",
          "national-id",
          "family",
          "household",
          "social",
          "beneficiary",
          "disability",
          "student",
          "farmer",
          "land",
          "utility",
          "other",
        ],
        event_type: "1",
        search_criteria: {
          query: {
            identifier_type: "UIN",
            identifier_value: "string",
          },
          record_type: [
            "person_record",
            "brith_cert",
            "death_cert",
            "marriage_cert",
            "other_record",
          ],
          sort: [
            {
              attribute_name: "string",
              sort_order: "asc",
            },
          ],
          pagination: {
            page_size: 2000,
            page_number: 5,
          },
        },
        consent: {
          id: "string",
          ts: "",
          purpose: {
            text: "string",
            code: "string",
            refUri: "http://example.com",
          },
        },
        locale: "en",
      },
    ],
  },
};
