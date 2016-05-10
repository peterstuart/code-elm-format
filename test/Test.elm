module Test (..) where

import StartApp.Simple as StartApp
import Html exposing (text)
import Signal exposing (Address)


type alias Model =
  { id : Int, name : String }


model : Model
model =
  { id = 1, name = "Test" }


view : Address Action -> Model -> Html
view address model =
  text model.name


type Action
  = NoOp


update : Action -> Model -> Model
update action model =
  case action of
    NoOp ->
      model


main =
  StartApp.start { model = model, view = view, update = update }
