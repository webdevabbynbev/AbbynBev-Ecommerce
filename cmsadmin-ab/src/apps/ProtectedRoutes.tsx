import { Navigate } from "react-router-dom"
import type { ReactNode } from "react" 
import helper from "../utils/helper"

interface Props {
  children: ReactNode
}

export default function ProtectedRoute({ children }: Props) {
  const isAuth = helper.isAuthenticated()
  return <>{isAuth ? children : <Navigate to="/login" replace />}</>
}
