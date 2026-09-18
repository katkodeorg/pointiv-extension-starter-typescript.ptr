declare module "main" {
  export function execute(): I32;
  export function render_tile(): I32;
}

declare module "extism:host" {
  interface user {
    pointiv_log(ptr: I64): void;
    pointiv_storage_read(ptr: I64): I64;
    pointiv_storage_write(ptr: I64, value: I64): void;
    pointiv_storage_delete(ptr: I64): void;
    pointiv_storage_list(): I64;
    pointiv_clipboard_read(): I64;
    pointiv_ai_complete(ptr: I64): I64;
    pointiv_http_request(ptr: I64): I64;
    pointiv_google_calendar_create(ptr: I64): I64;
    pointiv_google_gmail_send(ptr: I64): I64;
  }
}
