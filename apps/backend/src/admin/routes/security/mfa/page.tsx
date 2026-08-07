import { defineRouteConfig } from "@medusajs/admin-sdk"
import { Button, Container, Heading, Input, Text } from "@medusajs/ui"
import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query"
import QRCode from "qrcode"
import { FormEvent, useEffect, useState } from "react"
import { useTranslation } from "react-i18next"

import { sdk } from "../../../lib/sdk"

type MfaFactor = {
  id: string
  provider: string
  status: "pending" | "enabled" | "disabled"
}

type FactorsResponse = {
  mfa_factors: MfaFactor[]
}

type EnrollmentResponse = {
  mfa_factor: MfaFactor
  secret?: string
  otpauth_url?: string
}

type StepUpChallengeResponse = {
  challenge: {
    id: string
    methods: ("totp" | "recovery_code")[]
  }
}

const enrollmentStorageKey = "medusa-admin-mfa-enrollment"

const getStoredEnrollment = (): EnrollmentResponse | undefined => {
  if (typeof window === "undefined") {
    return undefined
  }

  try {
    const rawEnrollment = window.sessionStorage.getItem(enrollmentStorageKey)
    return rawEnrollment ? JSON.parse(rawEnrollment) : undefined
  } catch {
    window.sessionStorage.removeItem(enrollmentStorageKey)
    return undefined
  }
}

const MfaEnrollmentPage = () => {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const [enrollment, setEnrollment] = useState<EnrollmentResponse | undefined>(
    getStoredEnrollment
  )
  const [challenge, setChallenge] = useState<StepUpChallengeResponse["challenge"]>()
  const [existingFactorDetected, setExistingFactorDetected] = useState(false)
  const [code, setCode] = useState("")
  const [qrCodeUrl, setQrCodeUrl] = useState("")
  const [qrCodeError, setQrCodeError] = useState(false)
  const mfaText = (key: string, defaultValue: string) =>
    t(`mfa.${key}`, { defaultValue })

  useEffect(() => {
    const uri = enrollment?.otpauth_url
    if (!uri) {
      setQrCodeUrl("")
      setQrCodeError(false)
      return
    }

    let cancelled = false
    setQrCodeError(false)
    QRCode.toDataURL(uri, {
      errorCorrectionLevel: "M",
      margin: 1,
      width: 220,
    })
      .then((dataUrl) => {
        if (!cancelled) {
          setQrCodeUrl(dataUrl)
        }
      })
      .catch(() => {
        if (!cancelled) {
          setQrCodeError(true)
        }
      })

    return () => {
      cancelled = true
    }
  }, [enrollment?.otpauth_url])

  const factors = useQuery({
    queryKey: ["native-mfa-factors"],
    queryFn: () => sdk.client.fetch<FactorsResponse>("/auth/mfa/factors"),
  })
  const enabledFactor = factors.data?.mfa_factors.find(
    (factor) => factor.status === "enabled"
  )
  const hasIncompleteEnrollment = existingFactorDetected && !enabledFactor

  const setPendingEnrollment = (response: EnrollmentResponse | undefined) => {
    setEnrollment(response)
    if (typeof window === "undefined") {
      return
    }

    if (response) {
      window.sessionStorage.setItem(enrollmentStorageKey, JSON.stringify(response))
    } else {
      window.sessionStorage.removeItem(enrollmentStorageKey)
    }
  }

  const createFactor = useMutation({
    mutationFn: () =>
      sdk.client.fetch<EnrollmentResponse>("/auth/mfa/factors", {
        method: "POST",
        body: {
          provider: "totp",
          issuer: "Điện Tử Hưng Phát",
          label: "Admin",
        },
    }),
    onSuccess: setPendingEnrollment,
    onError: (error) => {
      if (error.message.includes("active TOTP factor already exists")) {
        setExistingFactorDetected(true)
      }
    },
  })

  const verifyFactor = useMutation({
    mutationFn: () =>
      sdk.client.fetch<EnrollmentResponse>(
        `/auth/mfa/factors/${enrollment?.mfa_factor.id}/verify`,
        { method: "POST", body: { code } }
      ),
    onSuccess: async () => {
      setCode("")
      setPendingEnrollment(undefined)
      await queryClient.invalidateQueries({ queryKey: ["native-mfa-factors"] })
    },
  })

  const startStepUp = useMutation({
    mutationFn: () =>
      sdk.client.fetch<StepUpChallengeResponse>(
        "/admin/security/mfa/challenges",
        { method: "POST" }
      ),
    onSuccess: (response) => setChallenge(response.challenge),
  })

  const verifyStepUp = useMutation({
    mutationFn: () =>
      sdk.client.fetch(
        `/admin/security/mfa/challenges/${challenge?.id}/verify`,
        { method: "POST", body: { method: "totp", code } }
      ),
    onSuccess: () => {
      window.location.assign("/app/settings/profile")
    },
  })

  const submitFactor = (event: FormEvent) => {
    event.preventDefault()
    verifyFactor.mutate()
  }

  const submitStepUp = (event: FormEvent) => {
    event.preventDefault()
    verifyStepUp.mutate()
  }

  const updateCode = (value: string) => setCode(value.replace(/\D/g, ""))

  if (factors.isLoading) {
    return (
      <Container>
        <Text>{mfaText("loading", "Đang kiểm tra trạng thái MFA...")}</Text>
      </Container>
    )
  }

  if (factors.error) {
    return <Container><Text className="text-ui-fg-error">{factors.error.message}</Text></Container>
  }

  return (
    <Container className="p-0">
      <div className="grid gap-2 border-b px-6 py-5">
        <Heading level="h1">
          {mfaText("title", "Thiết lập MFA cho quản trị viên")}
        </Heading>
        <Text className="text-ui-fg-subtle">
          {mfaText(
            "description",
            "Bảo vệ thao tác quản trị bằng ứng dụng xác thực TOTP như Google Authenticator hoặc Microsoft Authenticator."
          )}
        </Text>
      </div>
      <div className="grid max-w-2xl gap-5 px-6 py-5">
        {!enabledFactor && !hasIncompleteEnrollment && !enrollment ? (
          <>
            <Text>
              {mfaText(
                "noFactor",
                "Tài khoản này chưa có TOTP. Tạo cấu hình rồi thêm nó vào ứng dụng xác thực của bạn."
              )}
            </Text>
            <Button onClick={() => createFactor.mutate()} isLoading={createFactor.isPending}>
              {mfaText("createFactor", "Tạo cấu hình TOTP")}
            </Button>
            {createFactor.error ? <Text className="text-ui-fg-error">{createFactor.error.message}</Text> : null}
          </>
        ) : null}

        {enrollment ? (
          <>
            <div className="grid gap-2">
              <Text weight="plus">
                {mfaText("stepOne", "Quét mã bằng ứng dụng xác thực")}
              </Text>
              <Text>
                {mfaText(
                  "scanInstruction",
                  "Mở Google Authenticator hoặc Microsoft Authenticator, chọn thêm tài khoản rồi quét mã QR này."
                )}
              </Text>
              {qrCodeUrl ? (
                <div className="w-fit rounded-md bg-white p-3">
                  <img
                    src={qrCodeUrl}
                    alt={mfaText(
                      "qrAlt",
                      "Mã QR để thiết lập xác thực hai lớp"
                    )}
                    width={220}
                    height={220}
                  />
                </div>
              ) : null}
              {qrCodeError ? (
                <Text className="text-ui-fg-error">
                  {mfaText(
                    "qrError",
                    "Không thể tạo mã QR. Hãy dùng URI thiết lập thủ công bên dưới."
                  )}
                </Text>
              ) : null}
              <Text>
                {mfaText(
                  "manualSetup",
                  "Nếu không quét được QR, hãy thêm thủ công bằng URI hoặc secret bên dưới."
                )}
              </Text>
              <Text size="small" className="break-all rounded-md border p-3">
                {enrollment.otpauth_url}
              </Text>
              <Text size="small" className="text-ui-fg-subtle">
                {t("mfa.secret", {
                  defaultValue: "Secret: {{value}}",
                  value: enrollment.secret,
                })}
              </Text>
            </div>
            <form className="grid gap-3" onSubmit={submitFactor}>
              <label className="grid gap-1 text-sm">
                {mfaText("codeLabel", "Mã xác minh 6 số")}
                <Input inputMode="numeric" maxLength={6} value={code} onChange={(event) => updateCode(event.target.value)} required />
              </label>
              <Button type="submit" isLoading={verifyFactor.isPending} disabled={code.length !== 6}>
                {mfaText("verifyFactor", "Xác minh và bật MFA")}
              </Button>
              {verifyFactor.error ? <Text className="text-ui-fg-error">{verifyFactor.error.message}</Text> : null}
            </form>
          </>
        ) : null}

        {hasIncompleteEnrollment ? (
          <Text className="text-ui-fg-error">
            {mfaText(
              "incompleteEnrollment",
              "Có một cấu hình TOTP cũ chưa hoàn tất. Hãy liên hệ quản trị hệ thống để thực hiện quy trình khôi phục MFA có kiểm soát."
            )}
          </Text>
        ) : null}

        {enabledFactor && !challenge ? (
          <>
            <Text>
              {mfaText(
                "factorReady",
                "TOTP đã được bật. Xác minh phiên hiện tại để tiếp tục thay đổi thông tin quản trị."
              )}
            </Text>
            <Button onClick={() => startStepUp.mutate()} isLoading={startStepUp.isPending}>
              {mfaText("startStepUp", "Xác minh phiên quản trị")}
            </Button>
            {startStepUp.error ? <Text className="text-ui-fg-error">{startStepUp.error.message}</Text> : null}
          </>
        ) : null}

        {challenge ? (
          <form className="grid gap-3" onSubmit={submitStepUp}>
            <Text>
              {mfaText(
                "stepUpInstruction",
                "Nhập mã TOTP mới nhất từ ứng dụng xác thực để xác minh phiên này."
              )}
            </Text>
            <label className="grid gap-1 text-sm">
              {mfaText("codeLabel", "Mã xác minh 6 số")}
              <Input inputMode="numeric" maxLength={6} value={code} onChange={(event) => updateCode(event.target.value)} required />
            </label>
            <Button type="submit" isLoading={verifyStepUp.isPending} disabled={code.length !== 6}>
              {mfaText("verifyStepUp", "Xác minh phiên")}
            </Button>
            {verifyStepUp.error ? <Text className="text-ui-fg-error">{verifyStepUp.error.message}</Text> : null}
          </form>
        ) : null}
      </div>
    </Container>
  )
}

export const config = defineRouteConfig({
  label: "Thiết lập MFA",
  rank: 90,
})

export default MfaEnrollmentPage
