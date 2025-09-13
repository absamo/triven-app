import { type LoaderFunctionArgs } from "react-router";
import { createEventStream } from "~/app/utils/create-event-stream.server";

export async function loader({ request }: LoaderFunctionArgs) {
    // Create an event stream for notifications
    return createEventStream(request, "notifications");
}
