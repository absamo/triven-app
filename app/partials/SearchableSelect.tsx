import { useEffect, useState } from "react"
// import { useFetcher } from "@remix-run/react"
// import { useDebouncedValue } from "@mantine/hooks"
import { Select } from "@mantine/core"

export function SearchableSelect({ ...props }) {
  //   const fetcher = useFetcher()

  useEffect(() => {
    setSearchValue(props.searchValue)
  }, [props.searchValue])

  const [searchValue, setSearchValue] = useState<string>()

  // const [debounced] = useDebouncedValue(searchValue, 200)

  const handleSearch = (search: string) => {
    // fetcher.load(`/api/getSubcategories?search=${debounced}`)
    // fetcher.submit({ search: debounced })
    setSearchValue(search)
  }

  //   const handleChange = (value: string) => {
  //     // fetcher.load(`/api/getSubcategories?search=${value}`)
  //     props.onChange(value)
  //   }

  return (
    <Select
      {...props}
      allowDeselect={false}
      searchable
      onSearchChange={handleSearch}
      searchValue={searchValue}
      nothingFoundMessage={props.nothingFoundMessage || "No options"}
      comboboxProps={{ shadow: "md" }}
      styles={{
        dropdown: {
          zIndex: 9999,
        },
      }}
      description={props.description}
    />
  )
}

// import { useState } from "react"
// // import { useFetcher } from "@remix-run/react"
// // import { useDebouncedValue } from "@mantine/hooks"
// import { Combobox, InputBase, useCombobox } from "@mantine/core"

// export function SearchableSelect({ ...props }) {
//   const combobox = useCombobox({
//     onDropdownClose: () => combobox.resetSelectedOption(),
//   })

//   const [search, setSearch] = useState("")

//   const options = props.data.map((item: Record<string, string>) => (
//     <Combobox.Option value={item.value} key={item.value}>
//       {item.label}
//     </Combobox.Option>
//   ))

//   // const handleSearch = (search: string) => {
//   //   setSearchValue(search)
//   // }

//   return (
//     // <Select
//     //   searchable
//     //   onSearchChange={handleSearch}
//     //   searchValue={searchValue}
//     //   nothingFoundMessage={props.nothingFoundMessage || "No options"}
//     //   {...props}
//     // />

//     <Combobox
//       store={combobox}
//       withinPortal={false}
//       onOptionSubmit={(val, label) => {
//         if (val === "$create") {
//           // setData((current: string) => [...current, search])
//           // setValue(search)
//         } else {        //           setSearch(label.children)
//         }

//         combobox.closeDropdown()
//       }}
//     >
//       <Combobox.Target>
//         <InputBase
//           rightSection={<Combobox.Chevron />}
//           value={search}
//           onChange={(event) => {
//             combobox.openDropdown()
//             combobox.updateSelectedOptionIndex()
//             setSearch(event.currentTarget.value)
//           }}
//           onClick={() => combobox.openDropdown()}
//           onFocus={() => combobox.openDropdown()}
//           onBlur={() => {
//             combobox.closeDropdown()
//             setSearch(search || "")
//           }}
//           placeholder={props.placeholder}
//           rightSectionPointerEvents="none"
//           label={props.label}
//         />
//       </Combobox.Target>

//       <Combobox.Dropdown>
//         <Combobox.Options>
//           {options}
//           <Combobox.Option value="$create">+ Create</Combobox.Option>
//         </Combobox.Options>
//       </Combobox.Dropdown>
//     </Combobox>
//   )
// }
