"use client"
import { RadioGroup } from "@headlessui/react"
import { isStripeLike, isVietQr, paymentInfoMap } from "@lib/constants"
import { initiatePaymentSession } from "@lib/data/cart"
import { CheckCircleSolid, CreditCard } from "@medusajs/icons"
import ErrorMessage from "@modules/checkout/components/error-message"
import PaymentContainer, {
  StripeCardContainer,
} from "@modules/checkout/components/payment-container"
import Divider from "@modules/common/components/divider"
import {
  Button,
  Container,
  Heading,
  Text,
  clx,
} from "@modules/common/components/ui"
import { HttpTypes } from "@medusajs/types"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import Image from "next/image"
import { useCallback, useEffect, useState } from "react"

const getVietQrExpiry = (session?: HttpTypes.StorePaymentSession | null) => {
  const raw = session?.data?.expires_at
  if (typeof raw !== "string" && typeof raw !== "number") {
    return null
  }

  const expiry = new Date(raw)
  return Number.isNaN(expiry.getTime()) ? null : expiry
}

const Payment = ({
  cart,
  availablePaymentMethods,
}: {
  cart: HttpTypes.StoreCart
  availablePaymentMethods: { id: string }[]
}) => {
  const activeSession = cart.payment_collection?.payment_sessions?.find(
    (paymentSession) =>
      paymentSession.status === "pending" ||
      paymentSession.status === "pending_authorization"
  )

  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [cardBrand, setCardBrand] = useState<string | null>(null)
  const [cardComplete, setCardComplete] = useState(false)
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState(
    activeSession?.provider_id ?? ""
  )

  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()

  const isOpen = searchParams.get("step") === "payment"

  const vietQrExpiry = getVietQrExpiry(
    isVietQr(selectedPaymentMethod) ? activeSession : null
  )
  const vietQrExpired = !!vietQrExpiry && vietQrExpiry.getTime() <= Date.now()

  const setPaymentMethod = async (method: string) => {
    const previousMethod = selectedPaymentMethod
    setError(null)
    setSelectedPaymentMethod(method)

    try {
      if (isStripeLike(method) || isVietQr(method)) {
        await initiatePaymentSession(cart, {
          provider_id: method,
        })
        router.refresh()
      }
    } catch (err) {
      setSelectedPaymentMethod(previousMethod)
      setError(err instanceof Error ? err.message : "Không thể khởi tạo thanh toán.")
    }
  }

  const paidByGiftcard = !!(
    (cart as unknown as Record<string, unknown>)?.gift_cards && ((cart as unknown as Record<string, unknown>)?.gift_cards as unknown[])?.length > 0 && cart?.total === 0
  )

  const paymentReady =
    (activeSession && (cart?.shipping_methods?.length ?? 0) !== 0) || paidByGiftcard

  const createQueryString = useCallback(
    (name: string, value: string) => {
      const params = new URLSearchParams(searchParams)
      params.set(name, value)

      return params.toString()
    },
    [searchParams]
  )

  const handleEdit = () => {
    router.push(pathname + "?" + createQueryString("step", "payment"), {
      scroll: false,
    })
  }

  const handleSubmit = async () => {
    setIsLoading(true)
    try {
      const shouldInputCard =
        isStripeLike(selectedPaymentMethod) && !activeSession

      const checkActiveSession =
        activeSession?.provider_id === selectedPaymentMethod && !vietQrExpired

      if (!checkActiveSession) {
        await initiatePaymentSession(cart, {
          provider_id: selectedPaymentMethod,
        })
      }

      if (!shouldInputCard) {
        return router.push(
          pathname + "?" + createQueryString("step", "review"),
          {
            scroll: false,
          }
        )
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    setError(null)
  }, [isOpen])

  return (
    <div className="bg-white">
      <div className="flex flex-row items-center justify-between mb-6">
        <Heading
          level="h2"
          className={clx(
            "flex flex-row text-3xl-regular gap-x-2 items-baseline",
            {
              "opacity-50 pointer-events-none select-none":
                !isOpen && !paymentReady,
            }
          )}
        >
          Thanh toán
          {!isOpen && paymentReady && <CheckCircleSolid />}
        </Heading>
        {!isOpen && paymentReady && (
          <Text>
            <button
              type="button"
              onClick={handleEdit}
              className="text-ui-fg-interactive hover:text-ui-fg-interactive-hover"
              data-testid="edit-payment-button"
            >
              Chỉnh sửa
            </button>
          </Text>
        )}
      </div>
      <div>
        <div className={isOpen ? "block" : "hidden"}>
          {!paidByGiftcard && availablePaymentMethods?.length && (
            <>
              <RadioGroup
                value={selectedPaymentMethod}
                onChange={(value: string) => setPaymentMethod(value)}
              >
                {availablePaymentMethods.map((paymentMethod) => (
                  <div key={paymentMethod.id}>
                    {isStripeLike(paymentMethod.id) ? (
                      <StripeCardContainer
                        paymentProviderId={paymentMethod.id}
                        selectedPaymentOptionId={selectedPaymentMethod}
                        paymentInfoMap={paymentInfoMap}
                        setCardBrand={setCardBrand}
                        setError={setError}
                        setCardComplete={setCardComplete}
                      />
                    ) : (
                      <PaymentContainer
                        paymentInfoMap={paymentInfoMap}
                        paymentProviderId={paymentMethod.id}
                        selectedPaymentOptionId={selectedPaymentMethod}
                      />
                    )}
                  </div>
                ))}
              </RadioGroup>
            </>
          )}

          {paidByGiftcard && (
            <div className="flex flex-col w-1/3">
              <Text className="txt-medium-plus text-ui-fg-base mb-1">
                Phương thức thanh toán
              </Text>
              <Text
                className="txt-medium text-ui-fg-subtle"
                data-testid="payment-method-summary"
              >
                Thẻ quà tặng
              </Text>
            </div>
          )}

          <ErrorMessage
            error={error}
            id="payment-method-error"
            data-testid="payment-method-error-message"
          />

          <Button
            size="large"
            className="mt-6"
            onClick={handleSubmit}
            isLoading={isLoading}
            disabled={
              (isStripeLike(selectedPaymentMethod) && !cardComplete) ||
              (!selectedPaymentMethod && !paidByGiftcard) ||
              (isVietQr(selectedPaymentMethod) && vietQrExpired)
            }
            aria-describedby={error ? "payment-method-error" : undefined}
            data-testid="submit-payment-button"
          >
            {!activeSession && isStripeLike(selectedPaymentMethod)
              ? " Nhập thông tin thẻ"
              : "Tiếp tục kiểm tra đơn"}
          </Button>
        </div>

        <div className={isOpen ? "hidden" : "block"}>
          {cart && paymentReady && activeSession ? (
            <div className="flex flex-col gap-y-4 w-full">
              <div className="flex flex-col small:flex-row items-start gap-4 w-full">
              <div className="flex flex-col w-full small:w-1/3">
                <Text className="txt-medium-plus text-ui-fg-base mb-1">
                  Phương thức thanh toán
                </Text>
                <Text
                  className="txt-medium text-ui-fg-subtle"
                  data-testid="payment-method-summary"
                >
                  {paymentInfoMap[activeSession?.provider_id]?.title ||
                    activeSession?.provider_id}
                </Text>
              </div>
              <div className="flex flex-col w-full small:w-1/3">
                <Text className="txt-medium-plus text-ui-fg-base mb-1">
                  Chi tiết thanh toán
                </Text>
                <div
                  className="flex gap-2 txt-medium text-ui-fg-subtle items-center"
                  data-testid="payment-details-summary"
                >
                  <Container className="flex items-center h-7 w-fit p-2 bg-ui-button-neutral-hover">
                    {paymentInfoMap[selectedPaymentMethod]?.icon || (
                      <CreditCard />
                    )}
                  </Container>
                  <Text>
                    {isStripeLike(selectedPaymentMethod) && cardBrand
                      ? cardBrand
                      : isVietQr(selectedPaymentMethod)
                        ? "Quét QR và chờ kiểm tra sao kê"
                        : "Thanh toán khi nhận hàng"}
                  </Text>
                </div>
              </div>
              </div>
              {isVietQr(activeSession.provider_id) ? (
                <div className="rounded-lg border border-ui-border-base p-4">
                  <Text className="txt-medium-plus text-ui-fg-base">
                    VietQR do backend tạo
                  </Text>
                  {typeof activeSession.data?.qr_image_url === "string" ? (
                    <Image
                      src={activeSession.data.qr_image_url}
                      alt="Mã VietQR chuyển khoản"
                      width={240}
                      height={240}
                      unoptimized
                    />
                  ) : null}
                  <Text className="text-sm" aria-live="polite">
                    Trạng thái: {vietQrExpired ? "Mã đã hết hạn" : "Đang chờ xác nhận"}
                  </Text>
                  {activeSession.data?.transfer_content ? (
                    <Text className="text-sm">
                      Nội dung: {String(activeSession.data.transfer_content)}
                    </Text>
                  ) : null}
                  {vietQrExpiry ? (
                    <Text className="text-sm">
                      Hết hạn: {vietQrExpiry.toLocaleString("vi-VN")}
                    </Text>
                  ) : null}
                  <Text className="text-sm text-ui-fg-subtle">
                    Đơn chỉ được ghi nhận thanh toán sau khi nhân viên kiểm tra
                    sao kê ngân hàng.
                  </Text>
                </div>
              ) : null}
            </div>
          ) : paidByGiftcard ? (
            <div className="flex flex-col w-full small:w-1/3">
              <Text className="txt-medium-plus text-ui-fg-base mb-1">
                Phương thức thanh toán
              </Text>
              <Text
                className="txt-medium text-ui-fg-subtle"
                data-testid="payment-method-summary"
              >
                Thẻ quà tặng
              </Text>
            </div>
          ) : null}
        </div>
      </div>
      <Divider className="mt-8" />
    </div>
  )
}

export default Payment
