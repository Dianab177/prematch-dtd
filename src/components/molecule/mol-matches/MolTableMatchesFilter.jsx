import React, { useEffect, useState } from 'react'
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  getPaginationRowModel,
  getFilteredRowModel,
  getSortedRowModel
} from '@tanstack/react-table';
import { getMatch, getSearchMatch } from "../../../service/MatchesService";
import classNames from 'classnames'
import { rankItem } from '@tanstack/match-sorter-utils'
import {
  MagnifyingGlassIcon,
  BarsArrowDownIcon,
  BarsArrowUpIcon,
  ChevronUpDownIcon,
  ChevronDoubleLeftIcon,
  ChevronLeftIcon,
  ChevronDoubleRightIcon,
  ChevronRightIcon,
} from '@heroicons/react/24/solid'

const fuzzyFilter = (row, columnId, value, addMeta) => {
  const itemRank = rankItem(row.getValue(columnId), value)

  addMeta({ itemRank })

  return itemRank.passed
}

const DebouncedInput = ({ value: keyWord, onChange, ...props }) => {
  const [value, setValue] = useState(keyWord);
  
  // console.log(value);
 
  
  useEffect(() => {
    const timeout = setTimeout(() => {
      console.log('Filterd');
      onChange(value);
    }, 500)

    return () => clearTimeout(timeout);
  }, [value])

  return (
    <input {...props} value={value} onChange={e => setValue(e.target.value)} />
  )
}

const MolTableMatchesFilter = () => {
  const [data, setData] = useState([]);
  const [globalFilter, setGlobalFilter] = useState('');
  const [sorting, setSorting] = useState([]);
  console.log(globalFilter);

  
 
    const columns = [
      {
        accessorKey: 'nameEvent',
        header: () => <span>Evento</span>,
        cell: (info) => <span className='font-bold'>{info.getValue()}</span>,
      },
      { 
        accessorKey: 'nameCompany',
        header: () => <span>Compañia</span>
      },
      { 
        accessorKey: 'nameRecruiter',
        header: () => <span>Recruiter</span>
      },
      {
        accessorKey: 'nameCoder',
        header: () => <span>Coder</span>
      },
      {
        accessorKey: 'afinity',
        header: () => <span>Afinidad</span>,
        cell: (info) => {
          return (
            <span
              className={classNames({
                'text-white px-2 rounded-full font-semibold': true,
                'bg-orange': 'Inactivo' === info.getValue(),
                'bg-verde': 'Activo' === info.getValue(),
              })}
            >
              {info.getValue()}
            </span>
          );
        },
        enableSorting: true,
      },
      {
        accessor: 'actions',
        header: 'Acciones',
        cell: (info) => {
          return (
            <div className='space-x-2'>
              <button className='text-orange'>Eliminar</button>
              <button className='text-verde'>Editar</button>
            </div>
          );
        },
        enableSorting: false,
      },
    ];

  const getStateTable = () => {
    const totalRows = table.getFilteredRowModel().rows.length;
    const pageSize = table.getState().pagination.pageSize;
    const pageIndex = table.getState().pagination.pageIndex;
    const rowsPerPage = table.getRowModel().rows.length;

    const firstIndex = (pageIndex * pageSize) + 1;
    const lastIndex = (pageIndex * pageSize) + rowsPerPage;

    return {
      totalRows,
      firstIndex,
      lastIndex
    }
  }

  const table = useReactTable({
    data,
    columns,
    state: {
      globalFilter,
      sorting
    },
    initialState: {
      pagination: {
        pageSize: 15
      }
    },
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    globalFilterFn: fuzzyFilter,
    getSortedRowModel: getSortedRowModel(),
    onSortingChange: setSorting
  })

  useEffect(() => {
    getMatch()
      .then((response) => {
        const matches = response.data.map((match) => ({
          nameEvent: match.nameEvent,
          nameCompany: match.nameCompany,
          nameRecruiter: match.nameRecruiter,
          nameCoder: match.nameCoder,
          afinity: match.afinity,
        }));
        setData(matches);
      })
      .catch((error) => console.error(error));
  }, []);

  useEffect(() => {
    getSearchMatch()
      .then((response) => {
        const filteredData = response.data.filter(
          data =>
            data.num_match.includes(1) ||
            data.search_text.includes(globalFilter)
        );
        setGlobalFilter(filteredData[0]?.search_text || "");
;
        console.log(filteredData)
      })
      .catch((error) => console.error(error));
  }, [globalFilter]);

 

  return (
    <div className='px-6 py-4'>

      <div className='my-2 flex justify-end'>
        <div className='relative'>
          <DebouncedInput
            type="text"
            value={globalFilter ?? ''}
            onChange={value => setGlobalFilter(String(value))}
            className='px-6 py-2 text-stone6 border border-stone6 rounded outline-orange'
            placeholder='Buscar...'
          />
          <MagnifyingGlassIcon className='w-5 h-5 absolute top-3 left-1' />
        </div>
      </div>
      <div className='overflow-auto'>
        <table className='table-auto w-full min-w-[560px]'>
          <thead>
            {table.getHeaderGroups().map(headerGroup => (
              <tr key={headerGroup.id} className="border-b border-stone5 text-stone6 bg-stone3" >
                {headerGroup.headers.map(header => (
                  <th key={header.id} className="py-2 px-4 text-left uppercase">
                    {header.isPlaceholder
                      ? null
                      :
                      <div
                        className={classNames({
                          'cursor-pointer select-none flex justify-between': header.column.getCanSort(),
                        })}
                        onClick={header.column.getToggleSortingHandler()}
                      >
                        {flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                        {{
                          asc: <BarsArrowUpIcon className='w-5 h-5' />,
                          desc: <BarsArrowDownIcon className='w-5 h-5' />
                        }[header.column.getIsSorted()] ?? (header.column.getCanSort() ? <ChevronUpDownIcon className='w-5 h-5' /> : null)}
                      </div>
                    }
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.map(row => (
              <tr key={row.id} className="text-stone6 hover:bg-slate-100" >
                {row.getVisibleCells().map(cell => (
                  <td key={cell.id} className="py-2 px-4" >
                    {flexRender(
                      cell.column.columnDef.cell,
                      cell.getContext()
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className='mt-4 md:flex items-center justify-between space-y-4 text-center'>
        <div className='flex items-center gap-2'>
          <button
            className='text-stone6 bg-stone3 py-0.5 px-1 rounded border border-stone8
            disabled:hover:bg-white disabled:hover:text-stone3'
            onClick={() => table.setPageIndex(0)}
            disabled={!table.getCanPreviousPage()}>
            <ChevronDoubleLeftIcon className='w-5 h-5' />
          </button>
          <button
            className='text-stone6 bg-stone3 py-0.5 px-1 rounded border border-stone8
            disabled:hover:bg-white disabled:hover:text-stone3'
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}>
            <ChevronLeftIcon className='w-5 h-5' />
          </button>

          {table.getPageOptions().map((value, key) => (
            <button key={key}
              className={classNames({
                "text-stone6 bg-stone3 py-0.5 px-2 font-bold rounded border border-stone8 disabled:hover:bg-white disabled:hover:text-stone4": true,
                "bg-orangel text-orange": value === table.getState().pagination.pageIndex
              })}
              onClick={() => table.setPageIndex(value)}>
              {value + 1}
            </button>
          ))}

          <button
            className='text-stone6 bg-stone3 py-0.5 px-1 rounded border border-stone8
            disabled:hover:bg-white disabled:hover:text-stone3'
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}>
            <ChevronRightIcon className='w-5 h-5' />
          </button>
          <button
            className='text-stone6 bg-stone3 py-0.5 px-1 rounded border border-stone8
            disabled:hover:bg-white disabled:hover:text-stone3'
            onClick={() => table.setPageIndex(table.getPageCount() - 1)}
            disabled={!table.getCanNextPage()}>
            <ChevronDoubleRightIcon className='w-5 h-5' />
          </button>
        </div>
        <div className='text-stone6 font-semibold'>
          Mostrando de {getStateTable().firstIndex}&nbsp;
          a {getStateTable().lastIndex}&nbsp;
          del total de {getStateTable().totalRows} registros
        </div>
        <select
          className='text-stone6 border border-stone8 rounded outline-orange py-2'
          onChange={e => {
            table.setPageSize(Number(e.target.value))
          }}>
          <option value="5">5 pág.</option>
          <option value="10">10 pág.</option>
          <option value="20">20 pág.</option>
          <option value="25">25 pág.</option>
          <option value="50">50 pág.</option>
        </select>
      </div>
    </div>
  )
}

export default MolTableMatchesFilter