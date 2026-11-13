from app.ai.agent import write_reply
from app.ai.classifier import classify
from app.ai.rules import CUSTOMER_STEPS, resolve_issue
from app.ai.schemas import Decision

# Caps what one email sends to the model, so a huge thread can't blow the
# provider's per-request or per-minute token limits (~4 characters per token).
MAX_THREAD_CHARS = 50_000


def trim_thread(thread: str) -> str:
    """Keep the end of a long thread, where the latest message is."""
    if len(thread) <= MAX_THREAD_CHARS:
        return thread
    return "[Earlier part of the thread cut for length]\n\n" + thread[-MAX_THREAD_CHARS:]


def decide(thread: str, has_attachments: bool = False) -> Decision:
    """Run the AI steps for one email thread. The models propose, this function decides."""
    thread = trim_thread(thread)
    classification = classify(thread)

    def escalate(reason: str, proposed_action: str | None = None) -> Decision:
        return Decision(
            action="escalate",
            section=classification.section,
            reply=classification.acknowledgement,
            reason=reason,
            proposed_action=proposed_action,
        )

    if has_attachments:
        return escalate("The email has attachments")
    if classification.needs_human:
        return escalate(classification.reason)

    answer = write_reply(thread, classification.section)
    if answer.action == "escalate":
        return escalate(answer.reasoning)
    if not answer.enough_information:
        return escalate("The knowledge base does not answer this")
    if answer.issue:
        step = resolve_issue(answer.issue)
        if step not in CUSTOMER_STEPS:
            return escalate(f"Next step: {step}", proposed_action=step)
    if answer.promises_an_action:
        return escalate("The reply promises an action")

    return Decision(
        action="reply",
        section=classification.section,
        reply=answer.reply,
        reason=answer.reasoning,
    )