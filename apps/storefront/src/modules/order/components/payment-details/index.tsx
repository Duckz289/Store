import { Container, Heading, Text } from "@modules/common/components/ui"

import { isStripeLike, isVietQr, paymentInfoMap } from "@lib/constants"
import Divider from "@modules/common/components/divider"
import { convertToLocale } from "@lib/util/money"
import { HttpTypes } from "@medusajs/types"
import Image from "next/image"

type PaymentDetailsProps = {
  order: HttpTypes.StoreOrder
}

const PaymentDetails = ({ order }: PaymentDetailsProps) => {
  const payment = order.payment_collections?.[0].payments?.[0]
  const vietQrSession = order.payment_collections?.[0].payment_sessions?.find(
    (session) => isVietQr(session.provider_id)
  )

  return (
    <div>
      <Heading level="h2" className="flex flex-row text-3xl-regular my-6">
        Payment
      </Heading>
      <div>
        {payment && (
          <div className="flex items-start gap-x-1 w-full">
            <div className="flex flex-col w-1/3">
              <Text className="txt-medium-plus text-ui-fg-base mb-1">
                Payment method
              </Text>
              <Text
                className="txt-medium text-ui-fg-subtle"
                data-testid="payment-method"
              >
                {paymentInfoMap[payment.provider_id].title}
              </Text>
            </div>
            <div className="flex flex-col w-2/3">
              <Text className="txt-medium-plus text-ui-fg-base mb-1">
                Payment details
              </Text>
              <div className="flex gap-2 txt-medium text-ui-fg-subtle items-center">
                <Container className="flex items-center h-7 w-fit p-2 bg-ui-button-neutral-hover">
                  {paymentInfoMap[payment.provider_id].icon}
                </Container>
                <Text data-testid="payment-amount">
                  {isStripeLike(payment.provider_id) && payment.data?.card_last4
                    ? `**** **** **** ${payment.data.card_last4}`
                    : `${convertToLocale({
                        amount: payment.amount,
                        currency_code: order.currency_code,
                      })} paid at ${new Date(
                        payment.created_at ?? ""
                      ).toLocaleString()}`}
                </Text>
              </div>
            </div>
          </div>
        )}
        {!payment && vietQrSession ? (
          <div className="rounded-lg border border-ui-border-base p-4">
            <Text className="txt-medium-plus text-ui-fg-base">
              Chuyển khoản VietQR đang chờ xác nhận
            </Text>
            {typeof vietQrSession.data?.qr_image_url === "string" ? (
              <Image
                src={vietQrSession.data.qr_image_url}
                alt="Mã VietQR chuyển khoản"
                width={260}
                height={260}
                unoptimized
              />
            ) : null}
            <Text>
              Nội dung: {String(vietQrSession.data?.transfer_content ?? "")}
            </Text>
            <Text>
              Hết hạn:{" "}
              {new Date(
                String(vietQrSession.data?.expires_at)
              ).toLocaleString("vi-VN")}
            </Text>
            <Text className="text-sm text-ui-fg-subtle">
              Trang này không xác nhận giao dịch. Trạng thái chỉ đổi sau khi
              nhân viên kiểm tra sao kê ngân hàng.
            </Text>
          </div>
        ) : null}
      </div>

      <Divider className="mt-8" />
    </div>
  )
}

export default PaymentDetails
