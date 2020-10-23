import React, { useContext, useEffect, useState } from 'react'
import { db } from './firebaseApp'
import { UserContext } from './UserContext'
import './ListDomains.css'

type FieldDef = {
  key: string
  name: string
  datatype?: string
  readonly?: boolean
  format?: (str: string, row: any) => any
}

const formatRegistrar = (str: string, row: any) => {
  if (str.startsWith('http')) {
    const url = new URL(str)
    return <a href={str}>{url.host}</a>
  } else {
    return <span>{str}</span>
  }
}
const formatExpires = (str: string, row: any) => {
  const expires = new Date(row.currentExpiry).getTime()
  const today = new Date().getTime()
  const days = Math.floor((expires - today) / (1000 * 60 * 60 * 24))
  return days > 0 ? <>Expires in {days} days</> : <>Expired {days} days ago</>
}

const fields: FieldDef[] = [
  { key: 'name', name: 'Domain Name' },
  { key: 'purpose', name: 'purpose' },
  {
    key: 'currentRegistrar',
    name: 'currentRegistrar',
    format: formatRegistrar,
  },
  { key: 'firstRegisterd', name: 'firstRegisterd', datatype: 'date' },
  { key: 'currentExpiry', name: 'currentExpiry', datatype: 'date' },
  {
    key: 'expiresIn',
    name: 'expiresIn',
    readonly: true,
    format: formatExpires,
  },
]

export function ListDomains() {
  return (
    <div className="ListDomains">
      {fields.map(({ key, name }) => (
        <div key={key} className="ListDomains-header">
          {name}
        </div>
      ))}
      <div className="ListDomains-header"></div>

      <DomainRows />
      <AddNewDomainRow />
    </div>
  )
}

function DomainRows() {
  const [rows, setRows] = useState<any[]>([])
  const user = useContext(UserContext)

  useEffect(() => {
    if (!user) return
    db.collection('domains')
      .where('owner', '==', user.uid)
      .orderBy('firstRegisterd', 'asc')
      .onSnapshot((querySnapshot) => {
        const newRows: any[] = []
        querySnapshot.forEach(function (doc) {
          newRows.push({
            docId: doc.id,
            ...doc.data(),
          })
        })
        setRows(newRows)
      })
  }, [user])

  return (
    <>
      {rows.map((row) => (
        <DomainRow row={row} key={row.docId} />
      ))}
    </>
  )
}

function DomainRow({ row }: { row: any }) {
  const [editing, setEditing] = useState(false)
  const [rowChanges, setRowChanges] = useState({ ...row })
  const user = useContext(UserContext)
  useEffect(() => {
    setRowChanges(row)
  }, [editing, row])

  const doDelete = (docId: string) => {
    db.collection('domains').doc(docId).delete()
  }
  const doEdit = (edit: boolean) => {
    setEditing(edit)
  }
  const doSave = async () => {
    if (!user) return

    try {
      const doc = {
        ...rowChanges,
        docId: undefined,
      }
      console.log('doc:', doc)
      const docRef = await db
        .collection('domains')
        .doc(rowChanges.docId)
        .update(rowChanges)
      console.log('Document updated: ', docRef)
      setEditing(false)
    } catch (error) {
      console.error('Error adding document: ', error)
    }
  }

  return (
    <>
      {fields.map(({ key, datatype, format }) => (
        <div key={key} className="ListDomains-row">
          {editing ? (
            <input
              type={datatype}
              value={rowChanges[key] || ''}
              onChange={(e) =>
                setRowChanges({ ...rowChanges, [key]: e.target.value })
              }
            />
          ) : format ? (
            format(row[key], row)
          ) : (
            row[key]
          )}
        </div>
      ))}
      <div className="ListDomains-row">
        {editing ? (
          <>
            <button onClick={() => doSave()}>S</button>
            <button onClick={() => doEdit(false)}>C</button>|
          </>
        ) : (
          <>
            <button onClick={() => doEdit(true)}>E</button>|
            <button onClick={() => doDelete(row.docId)}>D</button>
          </>
        )}
      </div>
    </>
  )
}

function AddNewDomainRow() {
  const [newDomain, setNewDomain] = useState<any>({})
  const user = useContext(UserContext)

  const addNew = async () => {
    if (!user) return

    try {
      const doc = {
        owner: user.uid,
        ...newDomain,
      }
      console.log('doc:', doc)
      const docRef = await db.collection('domains').add(doc)
      console.log('Document written with ID: ', docRef.id)
    } catch (error) {
      console.error('Error adding document: ', error)
    }
  }

  return (
    <>
      {fields.map(({ key, datatype, readonly }) => (
        <div key={key} className="ListDomains-footer">
          {!readonly && (
            <input
              type={datatype}
              value={newDomain[key] || ''}
              onChange={(e) =>
                setNewDomain({ ...newDomain, [key]: e.target.value })
              }
            />
          )}
        </div>
      ))}
      <div>
        <button onClick={() => addNew()}>Add</button>
      </div>
    </>
  )
}
