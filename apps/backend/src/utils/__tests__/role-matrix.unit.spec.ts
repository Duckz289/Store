import {
  hasBusinessOwnerAccess,
  isSystemOwnerRole,
  SECURITY_ROLE_MATRIX,
} from "../role-matrix"

describe("security role matrix", () => {
  it("keeps reviewed business roles plus one unique system owner role", () => {
    expect(SECURITY_ROLE_MATRIX).toHaveLength(8)
    expect(new Set(SECURITY_ROLE_MATRIX.map((role) => role.name)).size).toBe(8)
  })

  it("keeps repair technicians away from contact PII and commerce writes", () => {
    const technician = SECURITY_ROLE_MATRIX.find(
      (role) => role.name === "Repair Technician"
    )!

    expect(technician.permissions).toEqual(
      expect.arrayContaining([
        { resource: "repair_case", operation: "read" },
        { resource: "repair_case", operation: "transition" },
        { resource: "repair_part_usage", operation: "create" },
        { resource: "repair_part_usage", operation: "reverse" },
      ])
    )
    expect(technician.permissions).not.toContainEqual({
      resource: "repair_contact",
      operation: "read_sensitive",
    })
    expect(
      technician.permissions.some((permission) =>
        ["order", "payment", "customer"].includes(permission.resource)
      )
    ).toBe(false)
  })

  it("keeps support away from payment and security administration", () => {
    const support = SECURITY_ROLE_MATRIX.find((role) => role.name === "Support")!
    const resources = support.permissions.map((permission) => permission.resource)

    expect(resources).not.toContain("payment")
    expect(resources).not.toContain("rbac_role")
    expect(resources).not.toContain("api_key")
  })

  it("makes the auditor read-only and owner explicitly unrestricted", () => {
    const auditor = SECURITY_ROLE_MATRIX.find(
      (role) => role.name === "Read-only Auditor"
    )!
    const owner = SECURITY_ROLE_MATRIX.find((role) => role.name === "Owner")!

    expect(auditor.permissions).toEqual([
      { resource: "*", operation: "read" },
    ])
    expect(owner.permissions).toEqual([{ resource: "*", operation: "*" }])
  })

  it("separates system ownership from business owner access", () => {
    expect(isSystemOwnerRole(["System Owner"])).toBe(true)
    expect(isSystemOwnerRole(["Owner"])).toBe(false)
    expect(hasBusinessOwnerAccess(["System Owner"])).toBe(true)
    expect(hasBusinessOwnerAccess(["Owner"])).toBe(true)
    expect(hasBusinessOwnerAccess(["Super Admin"])).toBe(true)
    expect(hasBusinessOwnerAccess(["Support"])).toBe(false)
  })

  it("uses Medusa's registered CRUD policies instead of dynamic wildcards", () => {
    const catalogManager = SECURITY_ROLE_MATRIX.find(
      (role) => role.name === "Catalog Manager"
    )!

    expect(catalogManager.permissions).toEqual(
      expect.arrayContaining([
        { resource: "product", operation: "create" },
        { resource: "product", operation: "read" },
        { resource: "product", operation: "update" },
        { resource: "product", operation: "delete" },
      ])
    )
    expect(
      catalogManager.permissions.some(
        (permission) => permission.operation === "*"
      )
    ).toBe(false)
  })
})
