import { useState } from "react"
import { Loader2Icon, RefreshCwIcon } from "lucide-react"
import { toast } from "sonner"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { api } from "@/lib/api"
import { refreshAll } from "@/lib/use-api"

export function PollButton() {
  const [running, setRunning] = useState(false)

  async function poll() {
    setRunning(true)
    try {
      const { messages } = await api.poll()
      toast.success(
        messages === 0
          ? "Inbox checked: no new emails"
          : `Processed ${messages} new email${messages === 1 ? "" : "s"}`
      )
      refreshAll()
    } catch (error) {
      toast.error("Inbox check failed", { description: (error as Error).message })
    } finally {
      setRunning(false)
    }
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button size="sm" disabled={running}>
          {running ? <Loader2Icon className="animate-spin" /> : <RefreshCwIcon />}
          <span className="hidden sm:inline">{running ? "Checking inbox…" : "Poll inbox now"}</span>
          <span className="sm:hidden">{running ? "Checking…" : "Poll"}</span>
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Check the inbox now?</AlertDialogTitle>
          <AlertDialogDescription>
            The bot processes every new email right away and sends real replies to customers. This
            can take up to a minute.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={poll}>Check inbox</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
